# -*- coding: utf-8 -*-
import argparse
from datetime import date, datetime
import json
import tempfile
import urllib.request
from pathlib import Path

from openpyxl import load_workbook


DEFAULT_SPREADSHEET_ID = "1IeBaoI0xaE_jQO9TXZBMiEWIoLdxb9tNSdEeCh9Rjbc"
DEFAULT_OUT = Path(__file__).resolve().parent / "app" / "src" / "features" / "app-data.js"
COMPLETED_VALUES = {"〇", "○", "完了", "見直し完了"}


def cell_text(value):
    if value is None:
        return ""
    if isinstance(value, datetime):
        return value.strftime("%Y-%m-%d %H:%M:%S")
    if isinstance(value, date):
        return value.isoformat()
    return str(value).strip()


def planned_date(value):
    if value is None:
        return ""
    if isinstance(value, datetime):
        return value.date().isoformat()
    if isinstance(value, date):
        return value.isoformat()

    text = str(value).strip()
    if not text or text in COMPLETED_VALUES:
        return ""

    normalized = text.replace("/", "-").replace(".", "-")
    for fmt in ("%Y-%m-%d", "%Y-%m-%d %H:%M:%S", "%m-%d"):
        try:
            parsed = datetime.strptime(normalized, fmt)
            if fmt == "%m-%d":
                parsed = parsed.replace(year=date.today().year)
            return parsed.date().isoformat()
        except ValueError:
            continue
    return ""


def download_sheet(spreadsheet_id):
    url = f"https://docs.google.com/spreadsheets/d/{spreadsheet_id}/export?format=xlsx"
    request = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(request, timeout=30) as response:
        data = response.read()
    temp = tempfile.NamedTemporaryFile(delete=False, suffix=".xlsx")
    temp.write(data)
    temp.close()
    return Path(temp.name)


def parse_args():
    parser = argparse.ArgumentParser(description="Generate static app data from the homework Google Sheet.")
    parser.add_argument("--spreadsheet-id", default=DEFAULT_SPREADSHEET_ID)
    parser.add_argument("--xlsx", type=Path, default=None)
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT)
    return parser.parse_args()


def main():
    args = parse_args()
    source = args.xlsx or download_sheet(args.spreadsheet_id)
    wb = load_workbook(source, data_only=True)
    items = []
    subject_counts = {}

    for sheet in wb.worksheets:
        subject = sheet.title
        subject_counts[subject] = 0
        for row_number in range(2, sheet.max_row + 1):
            values = [sheet.cell(row_number, column).value for column in range(1, 8)]
            if not any(values):
                continue
            lesson_progress = cell_text(values[0])
            raw_status = cell_text(values[6])
            status = "completed" if raw_status in COMPLETED_VALUES else "remaining"
            due_date = "" if status == "completed" else planned_date(values[6])
            subject_counts[subject] += 1
            items.append(
                {
                    "id": f"{subject}-{subject_counts[subject]}",
                    "subject": subject,
                    "lessonProgress": "done" if lesson_progress in COMPLETED_VALUES else "notYet",
                    "lessonProgressRaw": lesson_progress,
                    "textbook": values[1] or "",
                    "textbookRange": values[2] or "",
                    "testRange": values[3] or "",
                    "material": values[4] or "",
                    "task": values[5] or "",
                    "status": status,
                    "rawStatus": raw_status,
                    "plannedDate": due_date,
                }
            )

    args.out.parent.mkdir(parents=True, exist_ok=True)
    with open(args.out, "w", encoding="utf-8", newline="\n") as file:
        file.write("window.HOMEWORK_ITEMS = ")
        json.dump(items, file, ensure_ascii=False, separators=(",", ":"))
        file.write(";\n")
    print(f"{len(items)} items written to {args.out}")


if __name__ == "__main__":
    main()
