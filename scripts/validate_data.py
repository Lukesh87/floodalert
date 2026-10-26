"""
Standalone CLI Script to Validate CSV Data Quality
==================================================
Usage:
    python scripts/validate_data.py data/coimbatore_historical_floods.csv
"""

import sys
from pathlib import Path

backend_path = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(backend_path))

from app.services.ingestion_service import validate_and_ingest_rainfall_csv

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python scripts/validate_data.py <path_to_csv>")
        sys.exit(1)

    file_path = Path(sys.argv[1])
    if not file_path.exists():
        print(f"File not found: {file_path}")
        sys.exit(1)

    with open(file_path, "rb") as f:
        content = f.read()

    report = validate_and_ingest_rainfall_csv(content, file_path.name)
    print("=" * 60)
    print(f"DATA QUALITY QA REPORT: {report.get('filename')}")
    print("=" * 60)
    print(f"Status:        {report.get('status')}")
    print(f"Total Rows:    {report.get('total_rows')}")
    print(f"Valid Rows:    {report.get('valid_rows')}")
    print(f"Flagged Rows:  {report.get('flagged_rows')}")
    print(f"Quality Score: {report.get('data_quality_pct')}%")
    if report.get("sample_anomalies"):
        print("\nSample Anomalies:")
        for a in report["sample_anomalies"]:
            print(f"  - Row {a['row_index']}: {', '.join(a['issues'])}")
