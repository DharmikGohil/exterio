"""Retrieval for the material advisor: a small TF-IDF vector index in NumPy.

The knowledge base is a handful of short notes, so a lexical vector index is
accurate, needs no external service and adds no latency. The repository
interface is the seam for swapping in an embedding model with pgvector once
the knowledge base grows beyond what keyword overlap handles well.
"""

import math
import re
from pathlib import Path

import numpy as np
from numpy.typing import NDArray

from domain.interfaces.dtos.advisor_dto import KnowledgeSnippetDTO
from domain.interfaces.repos.knowledge_repo import IKnowledgeRepository

KNOWLEDGE_PATH = Path(__file__).resolve().parent.parent / "catalog" / "material_knowledge.md"
HEADING_PREFIX = "## "
MIN_SCORE = 0.05
TOKEN_PATTERN = re.compile(r"[a-z0-9]+")
STOP_WORDS = frozenset(
    {
        "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "has", "have", "how",
        "i", "in", "is", "it", "my", "of", "on", "or", "should", "that", "the", "this", "to",
        "was", "what", "when", "where", "which", "with", "you", "your", "can", "do", "does",
        "will", "would",
    }
)  # fmt: skip


def tokenize(text: str) -> list[str]:
    return [token for token in TOKEN_PATTERN.findall(text.lower()) if token not in STOP_WORDS]


class TfidfKnowledgeRepository(IKnowledgeRepository):
    def __init__(self, knowledge_path: Path = KNOWLEDGE_PATH) -> None:
        self._notes = self._load(knowledge_path.read_text(encoding="utf-8"))
        documents = [tokenize(f"{title} {title} {text}") for title, text in self._notes]
        vocabulary = sorted({token for document in documents for token in document})
        self._index = {token: position for position, token in enumerate(vocabulary)}
        document_frequency = np.zeros(len(vocabulary))
        for document in documents:
            for token in set(document):
                document_frequency[self._index[token]] += 1
        self._idf = np.log((1 + len(documents)) / (1 + document_frequency)) + 1
        self._matrix = np.vstack([self._vectorize(document) for document in documents])

    def search(self, query: str, limit: int) -> list[KnowledgeSnippetDTO]:
        vector = self._vectorize(tokenize(query))
        if not vector.any():
            return []
        scores = self._matrix @ vector
        ranked = np.argsort(scores)[::-1][:limit]
        return [
            KnowledgeSnippetDTO(
                title=self._notes[i][0], text=self._notes[i][1], score=float(scores[i])
            )
            for i in ranked
            if scores[i] >= MIN_SCORE
        ]

    def _vectorize(self, tokens: list[str]) -> NDArray[np.float64]:
        """L2-normalised TF-IDF vector, so a dot product is the cosine similarity."""
        vector = np.zeros(len(self._index))
        for token in tokens:
            position = self._index.get(token)
            if position is not None:
                vector[position] += 1
        vector = np.where(vector > 0, 1 + np.log(np.maximum(vector, 1)), 0) * self._idf
        norm = math.sqrt(float(vector @ vector))
        normalised: NDArray[np.float64] = vector / norm if norm else vector
        return normalised

    @staticmethod
    def _load(markdown: str) -> list[tuple[str, str]]:
        notes: list[tuple[str, str]] = []
        title = ""
        lines: list[str] = []
        for line in markdown.splitlines():
            if line.startswith(HEADING_PREFIX):
                if title and lines:
                    notes.append((title, "\n".join(lines).strip()))
                title, lines = line[len(HEADING_PREFIX) :].strip(), []
            elif title:
                lines.append(line)
        if title and lines:
            notes.append((title, "\n".join(lines).strip()))
        return notes
