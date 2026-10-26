"""
Data Ingestion & Quality Validation Service
===========================================
Validates CSV datasets, detects duplicates, identifies anomalous or missing values,
and generates structured quality assurance audit reports.
"""

import io
from typing import Any, Dict, List
import pandas as pd


def validate_and_ingest_rainfall_csv(file_bytes: bytes, filename: str) -> Dict[str, Any]:
    """
    Parses and checks rainfall CSV for required columns, plausible ranges, and anomalies.
    """
    try:
        df = pd.read_csv(io.BytesIO(file_bytes))
    except Exception as e:
        return {
            "success": False,
            "filename": filename,
            "error": f"Failed to parse CSV file: {str(e)}",
            "total_rows": 0,
            "valid_rows": 0,
            "flagged_rows": 0,
        }

    total_rows = len(df)
    if total_rows == 0:
        return {
            "success": False,
            "filename": filename,
            "error": "The uploaded CSV file is empty.",
            "total_rows": 0,
            "valid_rows": 0,
            "flagged_rows": 0,
        }

    # Normalize column names
    df.columns = [c.strip().lower() for c in df.columns]

    required_candidates = {
        "station_id": ["station_id", "station", "stationid", "id", "incident_id"],
        "rainfall_1h": ["rainfall_1h", "rainfall_1h_mm", "rain_1h", "rainfall", "rain"],
        "timestamp": ["timestamp", "date", "datetime", "observation_time", "incident_timestamp", "time"],
    }

    column_mapping = {}
    missing_fields = []

    for field, candidates in required_candidates.items():
        matched = False
        for cand in candidates:
            if cand in df.columns:
                column_mapping[field] = cand
                matched = True
                break
        if not matched:
            missing_fields.append(field)

    if missing_fields:
        return {
            "success": False,
            "filename": filename,
            "error": f"Missing required columns in CSV: {', '.join(missing_fields)}. Found columns: {list(df.columns)}",
            "total_rows": total_rows,
            "valid_rows": 0,
            "flagged_rows": total_rows,
        }

    # Quality checks
    anomalies: List[Dict[str, Any]] = []
    duplicates = int(df.duplicated().sum())

    valid_rows = 0
    flagged_rows = 0

    rain_col = column_mapping["rainfall_1h"]

    for idx, row in df.iterrows():
        row_issues = []
        rain_val = row[rain_col]

        # Check null
        if pd.isna(rain_val):
            row_issues.append("Missing rainfall measurement")
        else:
            try:
                r_float = float(rain_val)
                if r_float < 0:
                    row_issues.append(f"Negative rainfall ({r_float} mm) is physically impossible")
                elif r_float > 250:
                    row_issues.append(f"Extreme rainfall value ({r_float} mm/h) exceeds standard gauge threshold")
            except ValueError:
                row_issues.append(f"Invalid non-numeric rainfall value: '{rain_val}'")

        if row_issues:
            flagged_rows += 1
            if len(anomalies) < 10: # keep sample of first 10
                anomalies.append({
                    "row_index": idx + 1,
                    "issues": row_issues,
                })
        else:
            valid_rows += 1

    return {
        "success": True,
        "filename": filename,
        "total_rows": total_rows,
        "valid_rows": valid_rows,
        "flagged_rows": flagged_rows,
        "duplicate_rows": duplicates,
        "data_quality_pct": round((valid_rows / total_rows) * 100, 2),
        "status": "APPROVED" if (flagged_rows / total_rows) < 0.10 else "NEEDS_REVIEW",
        "sample_anomalies": anomalies,
    }
