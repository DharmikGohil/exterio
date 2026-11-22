from collections.abc import Iterator

from domain.entities.project_entity import Project
from domain.errors.project_errors import AiNotConfiguredError, AiProviderError
from domain.interfaces.dtos.advisor_dto import (
    AdvisorDoneEventDTO,
    AdvisorErrorEventDTO,
    AdvisorEventDTO,
    AdvisorReplyDTO,
    AdvisorSourceDTO,
    AdvisorStepEventDTO,
    AdvisorTextEventDTO,
    ChatMessageDTO,
    KnowledgeSnippetDTO,
)
from domain.interfaces.dtos.estimate_dto import EstimateDTO
from domain.interfaces.repos.knowledge_repo import IKnowledgeRepository
from domain.interfaces.repos.project_repo import IProjectRepository
from domain.interfaces.services.advisor_service import IAdvisorLanguageModel
from domain.prompts.advisor_prompt import build_advisor_system_prompt
from domain.services.advisor_reply_guard import GuardedTextStream
from domain.services.project_access import get_owned_project
from domain.use_cases.estimate.get_design_estimate_usecase import GetDesignEstimateUseCase

SNIPPET_LIMIT = 4
MAX_HISTORY_MESSAGES = 12
MAX_MESSAGE_CHARS = 2000

STEP_NOTES = "notes"
STEP_PROJECT = "project"
STEP_ANSWER = "answer"


class AskAdvisorUseCase:
    """Material advisor: retrieval-augmented answers grounded in the user's own project.

    Retrieval picks the knowledge notes closest to the question. The prompt also
    carries the project's measured areas and current costs, so cost answers use
    real figures instead of invented ones.

    `stream` reports each of those stages as it happens and then the answer in pieces, so the
    homeowner sees the work instead of a spinner. `execute` is the same answer in one piece.
    """

    def __init__(
        self,
        project_repo: IProjectRepository,
        knowledge_repo: IKnowledgeRepository,
        language_model: IAdvisorLanguageModel,
        get_estimate: GetDesignEstimateUseCase,
    ) -> None:
        self._project_repo = project_repo
        self._knowledge_repo = knowledge_repo
        self._language_model = language_model
        self._get_estimate = get_estimate

    def execute(
        self, project_id: str, design_id: str | None, user_id: str, messages: list[ChatMessageDTO]
    ) -> AdvisorReplyDTO:
        for event in self.stream(project_id, design_id, user_id, messages):
            if isinstance(event, AdvisorErrorEventDTO):
                raise AiProviderError(event.message)
            if isinstance(event, AdvisorDoneEventDTO):
                return event.reply
        raise AiProviderError("The advisor returned an empty answer.")

    def stream(
        self, project_id: str, design_id: str | None, user_id: str, messages: list[ChatMessageDTO]
    ) -> Iterator[AdvisorEventDTO]:
        """Checks access and loads the design's figures now, so a refusal or a missing design is
        an ordinary error; the rest of the work runs as the events are read."""
        if not self._language_model.is_available():
            raise AiNotConfiguredError("The material advisor")
        project = get_owned_project(self._project_repo, project_id, user_id)
        history = [
            ChatMessageDTO(message.role, message.content[:MAX_MESSAGE_CHARS])
            for message in messages[-MAX_HISTORY_MESSAGES:]
        ]
        estimate = None
        if design_id and project.image is not None:
            estimate = self._get_estimate.execute(design_id, user_id)
        return self._answer(project, estimate, history)

    def _answer(
        self, project: Project, estimate: EstimateDTO | None, history: list[ChatMessageDTO]
    ) -> Iterator[AdvisorEventDTO]:
        yield AdvisorStepEventDTO(STEP_NOTES, "Searching material notes", "running")
        question = next((m.content for m in reversed(history) if m.role == "user"), "")
        snippets = self._knowledge_repo.search(question, SNIPPET_LIMIT)
        sources = tuple(AdvisorSourceDTO(snippet.title) for snippet in snippets)
        yield AdvisorStepEventDTO(
            STEP_NOTES, "Searched material notes", "done", self._describe_notes(snippets)
        )

        yield AdvisorStepEventDTO(
            STEP_PROJECT, "Checked your house", "done", self._describe_project(project, estimate)
        )

        system_prompt = build_advisor_system_prompt(
            self._format_knowledge(snippets), self._format_project(project, estimate)
        )
        yield AdvisorStepEventDTO(STEP_ANSWER, "Writing the answer", "running")
        guarded = GuardedTextStream()
        try:
            for piece in self._language_model.stream(system_prompt, history):
                safe = guarded.push(piece)
                if safe:
                    yield AdvisorTextEventDTO(safe)
        except AiProviderError as error:
            yield AdvisorErrorEventDTO(str(error))
            return
        rest = guarded.finish()
        if rest:
            yield AdvisorTextEventDTO(rest)
        if not guarded.text:
            yield AdvisorErrorEventDTO("The advisor returned an empty answer.")
            return
        yield AdvisorStepEventDTO(STEP_ANSWER, "Wrote the answer", "done")
        yield AdvisorDoneEventDTO(AdvisorReplyDTO(reply=guarded.text, sources=sources))

    @staticmethod
    def _describe_notes(snippets: list[KnowledgeSnippetDTO]) -> str:
        if not snippets:
            return "No matching notes; answering from general guidance."
        count = f"{len(snippets)} note{'s' if len(snippets) != 1 else ''}"
        return f"Found {count}: " + ", ".join(snippet.title for snippet in snippets)

    @staticmethod
    def _describe_project(project: Project, estimate: EstimateDTO | None) -> str:
        if estimate is None:
            return f"“{project.name}” has no design or measurements yet."
        parts = sum(surface.count for surface in estimate.surfaces)
        finishes = len(estimate.lines)
        return (
            f"“{project.name}”: {parts} part{'s' if parts != 1 else ''}, "
            f"{finishes} finish{'es' if finishes != 1 else ''}, "
            f"₹{estimate.totals.grand_total:,.0f} estimated"
        )

    @staticmethod
    def _format_knowledge(snippets: list[KnowledgeSnippetDTO]) -> str:
        if not snippets:
            return "(no matching notes)"
        return "\n\n".join(f"### {snippet.title}\n{snippet.text}" for snippet in snippets)

    @staticmethod
    def _format_project(project: Project, estimate: EstimateDTO | None) -> str:
        if estimate is None:
            return f"Project '{project.name}'. No design or measurements yet."
        lines = [f"Project '{project.name}'. {estimate.scale.note}"]
        lines += [
            f"- {surface.label}: {surface.count} region(s), {surface.area_sqft:g} sq ft"
            for surface in estimate.surfaces
        ]
        lines += [
            f"- Chosen: {line.material_name}: net {line.net_quantity:g} {line.unit}, plus "
            f"{line.wastage_pct:g}% wastage = {line.gross_quantity:g} {line.unit} to buy. "
            f"Material INR {line.material_rate:g}/{line.unit} on the quantity with wastage = "
            f"INR {line.material_cost:,.0f}. Labour INR {line.labour_rate:g}/{line.unit} on the "
            f"net quantity = INR {line.labour_cost:,.0f}. Line total INR {line.total:,.0f}."
            for line in estimate.lines
        ]
        lines.append(f"Grand total INR {estimate.totals.grand_total:,.0f} (advisory).")
        return "\n".join(lines)
