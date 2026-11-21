from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime

from domain.interfaces.dtos.estimate_dto import EstimateDTO


@dataclass(frozen=True)
class ReportData:
    project_name: str
    design_name: str
    prepared_for: str
    generated_at: datetime
    original_image: bytes
    redesigned_image: bytes | None
    redesigned_caption: str
    estimate: EstimateDTO


class IReportService(ABC):
    @abstractmethod
    def build(self, data: ReportData) -> bytes: ...
