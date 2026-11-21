from domain.entities.project_entity import Project
from domain.errors.project_errors import AiNotConfiguredError
from domain.interfaces.dtos.advisor_dto import (
    AdvisorReplyDTO,
    AdvisorSourceDTO,
    ChatMessageDTO,
    KnowledgeSnippetDTO,
)
from domain.interfaces.dtos.estimate_dto import EstimateDTO
from domain.interfaces.repos.knowledge_repo import IKnowledgeRepository
from domain.interfaces.repos.project_repo import IProjectRepository
from domain.interfaces.services.advisor_service import IAdvisorLanguageModel
from domain.prompts.advisor_prompt import build_advisor_system_prompt
from domain.services.advisor_reply_guard import guard_advisor_reply
from domain.services.project_access import get_owned_project
from domain.use_cases.estimate.get_design_estimate_usecase import GetDesignEstimateUseCase

SNIPPET_LIMIT = 4
MAX_HISTORY_MESSAGES = 12
MAX_MESSAGE_CHARS = 2000


class AskAdvisorUseCase:
    """Material advisor: retrieval-augmented answers grounded in the user's own project.

    Retrieval picks the knowledge notes closest to the question. The prompt also
    carries the project's measured areas and current costs, so cost answers use
    real figures instead of invented ones.
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
        if not self._language_model.is_available():
            raise AiNotConfiguredError("The material advisor")
        project = get_owned_project(self._project_repo, project_id, user_id)

        history = [
            ChatMessageDTO(message.role, message.content[:MAX_MESSAGE_CHARS])
            for message in messages[-MAX_HISTORY_MESSAGES:]
        ]
        question = next((m.content for m in reversed(history) if m.role == "user"), "")
        snippets = self._knowledge_repo.search(question, SNIPPET_LIMIT)

        estimate = None
        if design_id and project.image is not None:
            estimate = self._get_estimate.execute(design_id, user_id)
        system_prompt = build_advisor_system_prompt(
            self._format_knowledge(snippets), self._format_project(project, estimate)
        )
        reply = guard_advisor_reply(self._language_model.reply(system_prompt, history))
        return AdvisorReplyDTO(
            reply=reply, sources=tuple(AdvisorSourceDTO(snippet.title) for snippet in snippets)
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
