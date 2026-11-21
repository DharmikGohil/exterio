"""PDF report a homeowner can hand to a contractor.

Tables are shaped with pandas (grouping, totals, formatting) and laid out
with ReportLab's flowables, so the report paginates on its own.
"""

import io
from typing import Any
from xml.sax.saxutils import escape

import pandas as pd
from reportlab.lib import colors
from reportlab.lib.enums import TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.lib.utils import ImageReader
from reportlab.platypus import (
    Image,
    KeepTogether,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

from domain.interfaces.dtos.estimate_dto import EstimateDTO
from domain.interfaces.services.report_service import IReportService, ReportData

PAGE_MARGIN = 16 * mm
CONTENT_WIDTH = A4[0] - 2 * PAGE_MARGIN
IMAGE_GAP = 6 * mm
MAX_IMAGE_HEIGHT = 95 * mm
BRAND = colors.HexColor("#1F3A5F")
MUTED = colors.HexColor("#5B6770")
ROW_ALT = colors.HexColor("#F3F6F9")
RULE = colors.HexColor("#D5DCE3")
RUPEE = "Rs "

UNIT_LABELS = {"sqft": "sq ft", "rft": "running ft"}


def money(value: float) -> str:
    """Indian digit grouping: 12,34,567."""
    whole = f"{abs(round(value)):d}"
    head, tail = whole[:-3], whole[-3:]
    groups: list[str] = []
    while len(head) > 2:
        groups.insert(0, head[-2:])
        head = head[:-2]
    if head:
        groups.insert(0, head)
    grouped = ",".join([*groups, tail]) if groups else tail
    return f"{'-' if value < 0 else ''}{RUPEE}{grouped}"


def number(value: float) -> str:
    return f"{value:,.1f}".rstrip("0").rstrip(".")


def title_case(value: str) -> str:
    return value.replace("_", " ").capitalize()


class ReportLabReportService(IReportService):
    def __init__(self) -> None:
        base = getSampleStyleSheet()
        self._title = ParagraphStyle(
            "title", parent=base["Title"], textColor=BRAND, fontSize=20, alignment=0, spaceAfter=2
        )
        self._subtitle = ParagraphStyle(
            "subtitle", parent=base["Normal"], textColor=MUTED, fontSize=9.5, leading=13
        )
        self._heading = ParagraphStyle(
            "heading",
            parent=base["Heading2"],
            textColor=BRAND,
            fontSize=12.5,
            spaceBefore=12,
            spaceAfter=6,
        )
        self._body = ParagraphStyle("body", parent=base["Normal"], fontSize=9, leading=12.5)
        self._small = ParagraphStyle(
            "small", parent=base["Normal"], fontSize=8, leading=11, textColor=MUTED
        )
        self._cell = ParagraphStyle("cell", parent=base["Normal"], fontSize=8, leading=10)
        self._total = ParagraphStyle(
            "total",
            parent=base["Normal"],
            fontSize=15,
            leading=18,
            textColor=BRAND,
            alignment=TA_RIGHT,
        )

    def build(self, data: ReportData) -> bytes:
        buffer = io.BytesIO()
        document = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            leftMargin=PAGE_MARGIN,
            rightMargin=PAGE_MARGIN,
            topMargin=PAGE_MARGIN,
            bottomMargin=PAGE_MARGIN,
            title=f"Renovation report - {data.project_name}",
            author="Exterio",
        )
        estimate = data.estimate
        story: list[Any] = [
            Paragraph("Exterior renovation report", self._title),
            Paragraph(
                f"<b>{escape(data.project_name)}</b> &nbsp;|&nbsp; "
                f"Design: {escape(data.design_name)} &nbsp;|&nbsp; "
                f"Prepared for {escape(data.prepared_for)} &nbsp;|&nbsp; "
                f"{data.generated_at:%d %b %Y}",
                self._subtitle,
            ),
            Spacer(1, 8),
            self._images(data),
            Paragraph("Cost summary", self._heading),
            self._summary(estimate),
            Paragraph("Selected materials", self._heading),
            self._materials(estimate),
            Paragraph("Surface areas", self._heading),
            Paragraph(escape(estimate.scale.note), self._small),
            Spacer(1, 4),
            self._surfaces(estimate),
            Paragraph("Quantities", self._heading),
            self._quantities(estimate),
            Paragraph("Cost breakdown", self._heading),
            self._costs(estimate),
            KeepTogether(
                [
                    Paragraph("Assumptions and limits", self._heading),
                    *[
                        Paragraph(f"&bull; {escape(note)}", self._body)
                        for note in estimate.assumptions
                    ],
                ]
            ),
        ]
        document.build(story, onFirstPage=self._footer, onLaterPages=self._footer)
        return buffer.getvalue()

    def _footer(self, canvas: Any, document: Any) -> None:
        canvas.saveState()
        canvas.setFont("Helvetica", 7.5)
        canvas.setFillColor(MUTED)
        canvas.drawString(
            PAGE_MARGIN, 9 * mm, "Advisory estimate generated by Exterio. Not a binding quotation."
        )
        canvas.drawRightString(A4[0] - PAGE_MARGIN, 9 * mm, f"Page {document.page}")
        canvas.restoreState()

    def _images(self, data: ReportData) -> Table:
        pictures = [(data.original_image, "Original")]
        if data.redesigned_image is not None:
            pictures.append((data.redesigned_image, data.redesigned_caption))
        width = (CONTENT_WIDTH - IMAGE_GAP * (len(pictures) - 1)) / len(pictures)
        images, captions = [], []
        for content, caption in pictures:
            pixel_width, pixel_height = ImageReader(io.BytesIO(content)).getSize()
            height = min(width * pixel_height / pixel_width, MAX_IMAGE_HEIGHT)
            images.append(
                Image(io.BytesIO(content), width=height * pixel_width / pixel_height, height=height)
            )
            captions.append(Paragraph(escape(caption), self._small))
        table = Table([images, captions], colWidths=[width + IMAGE_GAP / 2] * len(pictures))
        table.setStyle(
            TableStyle([("ALIGN", (0, 0), (-1, -1), "CENTER"), ("VALIGN", (0, 0), (-1, -1), "TOP")])
        )
        return table

    def _summary(self, estimate: EstimateDTO) -> Table:
        totals = estimate.totals
        left = [
            Paragraph(f"Material: <b>{money(totals.material_cost)}</b>", self._body),
            Paragraph(f"Labour: <b>{money(totals.labour_cost)}</b>", self._body),
            Paragraph(
                f"Likely range: {money(totals.low_estimate)} to {money(totals.high_estimate)} "
                f"(±{estimate.scale.confidence_pct:g}%)",
                self._small,
            ),
        ]
        right = [
            Paragraph("Grand total", self._small),
            Paragraph(f"<b>{money(totals.grand_total)}</b>", self._total),
        ]
        table = Table([[left, right]], colWidths=[CONTENT_WIDTH * 0.6, CONTENT_WIDTH * 0.4])
        table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, -1), ROW_ALT),
                    ("BOX", (0, 0), (-1, -1), 0.5, RULE),
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 10),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                    ("TOPPADDING", (0, 0), (-1, -1), 8),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                ]
            )
        )
        return table

    def _materials(self, estimate: EstimateDTO) -> Table | Paragraph:
        frame = pd.DataFrame(
            [
                {"Material": region.material_name, "Applied to": region.name}
                for region in estimate.regions
                if region.material_name
            ]
        )
        if frame.empty:
            return Paragraph("No materials have been applied in this design yet.", self._body)
        grouped = frame.groupby("Material", sort=False)["Applied to"].agg(", ".join).reset_index()
        return self._table(grouped, [0.4, 0.6], numeric_from=None)

    def _surfaces(self, estimate: EstimateDTO) -> Table | Paragraph:
        frame = pd.DataFrame(
            [
                {
                    "Surface": region.name + (" *" if region.is_override else ""),
                    "Type": title_case(region.label),
                    "Area (sq ft)": number(region.area_sqft),
                    "Length (ft)": number(region.length_ft),
                    "Finish": region.material_name or "-",
                }
                for region in estimate.regions
            ]
        )
        if frame.empty:
            return Paragraph("No regions have been marked on the photo.", self._body)
        return self._table(frame, [0.26, 0.14, 0.14, 0.14, 0.32], numeric_from=2, numeric_to=3)

    def _quantities(self, estimate: EstimateDTO) -> Table | Paragraph:
        frame = pd.DataFrame(
            [
                {
                    "Material": line.material_name,
                    "Net": f"{number(line.net_quantity)} {UNIT_LABELS[line.unit]}",
                    "Wastage": f"{line.wastage_pct:g}%",
                    "With wastage": f"{number(line.gross_quantity)} {UNIT_LABELS[line.unit]}",
                    "To buy": f"{number(line.purchase_quantity)} {line.purchase_unit}",
                    "Basis": line.purchase_note,
                }
                for line in estimate.lines
            ]
        )
        if frame.empty:
            return Paragraph("Apply materials to see quantities.", self._body)
        return self._table(
            frame, [0.25, 0.14, 0.09, 0.15, 0.13, 0.24], numeric_from=1, numeric_to=4
        )

    def _costs(self, estimate: EstimateDTO) -> Table | Paragraph:
        frame = pd.DataFrame(
            [
                {
                    "category": title_case(line.category),
                    "Item": line.material_name,
                    "Material rate": f"{money(line.material_rate)}/{line.unit}",
                    "Labour rate": f"{money(line.labour_rate)}/{line.unit}",
                    "material": line.material_cost,
                    "labour": line.labour_cost,
                    "total": line.total,
                }
                for line in estimate.lines
            ]
        )
        if frame.empty:
            return Paragraph("Apply materials to see costs.", self._body)

        rows: list[dict[str, str]] = []
        subtotal_rows: list[int] = []
        for category, group in frame.groupby("category", sort=False):
            for record in group.to_dict("records"):
                rows.append(
                    {
                        "Item": record["Item"],
                        "Material rate": record["Material rate"],
                        "Labour rate": record["Labour rate"],
                        "Material": money(record["material"]),
                        "Labour": money(record["labour"]),
                        "Total": money(record["total"]),
                    }
                )
            subtotal_rows.append(len(rows) + 1)
            rows.append(
                {
                    "Item": f"{category} subtotal",
                    "Material rate": "",
                    "Labour rate": "",
                    "Material": money(float(group["material"].sum())),
                    "Labour": money(float(group["labour"].sum())),
                    "Total": money(float(group["total"].sum())),
                }
            )
        rows.append(
            {
                "Item": "Grand total",
                "Material rate": "",
                "Labour rate": "",
                "Material": money(estimate.totals.material_cost),
                "Labour": money(estimate.totals.labour_cost),
                "Total": money(estimate.totals.grand_total),
            }
        )
        table = self._table(
            pd.DataFrame(rows), [0.3, 0.15, 0.15, 0.13, 0.13, 0.14], numeric_from=1, numeric_to=5
        )
        bold_rows = [*subtotal_rows, len(rows)]
        table.setStyle(
            TableStyle(
                [("FONTNAME", (0, row), (-1, row), "Helvetica-Bold") for row in bold_rows]
                + [("LINEABOVE", (0, len(rows)), (-1, len(rows)), 0.8, BRAND)]
            )
        )
        return table

    def _table(
        self,
        frame: pd.DataFrame,
        width_ratios: list[float],
        numeric_from: int | None,
        numeric_to: int | None = None,
    ) -> Table:
        header_style = ParagraphStyle("header-cell", parent=self._cell, textColor=colors.white)
        header = [Paragraph(f"<b>{column}</b>", header_style) for column in frame.columns]
        body = [
            [Paragraph(escape(str(value)), self._cell) for value in row]
            for row in frame.itertuples(index=False)
        ]
        table = Table(
            [header, *body],
            colWidths=[CONTENT_WIDTH * ratio for ratio in width_ratios],
            repeatRows=1,
        )
        style = [
            ("BACKGROUND", (0, 0), (-1, 0), BRAND),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, ROW_ALT]),
            ("LINEBELOW", (0, 0), (-1, -1), 0.25, RULE),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ]
        table.setStyle(TableStyle(style))
        if numeric_from is not None:
            last = numeric_to if numeric_to is not None else len(frame.columns) - 1
            right = ParagraphStyle("cell-right", parent=self._cell, alignment=TA_RIGHT)
            header_right = ParagraphStyle("header-right", parent=header_style, alignment=TA_RIGHT)
            for column in range(numeric_from, last + 1):
                header[column].style = header_right
                for row in body:
                    row[column].style = right
        return table
