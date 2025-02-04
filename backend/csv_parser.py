import csv
from typing import List, Dict

def parse_csv(file_path: str) -> List[Dict]:
    """Parse CSV file and return list of dictionaries."""
    result = []
    
    with open(file_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Skip empty rows
            if not any(row.values()):
                continue
            result.append(row)
    
    return result
