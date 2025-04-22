import os

UPLOAD_DIR = "../data/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

SAVE_DIR = "../data/processed_assessments"
os.makedirs(SAVE_DIR, exist_ok=True)

OUTPUT_DIR = "../data/output"
os.makedirs(OUTPUT_DIR, exist_ok=True)

REPORT_DIR = "../data/generated_reports"
os.makedirs(REPORT_DIR, exist_ok=True)
