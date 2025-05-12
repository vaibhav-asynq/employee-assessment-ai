import os
import sys
import json
import time
import asyncio
import argparse
from datetime import datetime

# Add the parent directory to the path so we can import from backend
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import necessary modules
from utils.loggers.feedback_logger import feedbackLogger
from main import (
    process_batches_parallel,
    SortEvidenceRequest
)
from config.api_config import MAX_CONCURRENT_API_CALLS

# Mock dependencies for testing
class MockUser:
    def __init__(self, user_id="test_user"):
        self.user_id = user_id

class MockDB:
    pass

# Mock function to simulate get_cached_feedback
def mock_get_cached_feedback(user_id, file_id, db):
    """
    Simulate the get_cached_feedback function by loading data from stage4 test files.
    
    Args:
        user_id: User ID (not used in this mock)
        file_id: File ID to load data for
        db: Database session (not used in this mock)
        
    Returns:
        Dictionary with feedback data loaded from stage4 test files
    """
    # Load stage4 data which contains categorized feedback
    stage4_path = os.path.join("tests", "output", "stages", f"stage4_{file_id}.json")
    
    if os.path.exists(stage4_path):
        with open(stage4_path, "r") as f:
            return json.load(f)
    
    # If file doesn't exist, return empty data
    print(f"Warning: Stage4 data not found at {stage4_path}")
    return {
        "strengths": {},
        "areas_to_target": {}
    }

async def run_sorting_test(file_id):
    """Run performance tests on sorting functions"""
    import anthropic
    import env_variables
    
    print("="*80)
    print(f"STARTING SORTING PERFORMANCE TEST: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Using max concurrent API calls: {MAX_CONCURRENT_API_CALLS}")
    print(f"Using file ID: {file_id}")
    print("="*80)
    
    # Initialize Claude client
    client = anthropic.Anthropic(api_key=env_variables.ANTHROPIC_API_KEY)
    
    # Load test data using our mock function
    mock_user = MockUser()
    mock_db = MockDB()
    feedback_data = mock_get_cached_feedback(mock_user.user_id, file_id, mock_db)
    
    if not feedback_data or not feedback_data.get("strengths") or not feedback_data.get("areas_to_target"):
        print(f"Error: Could not load stage4 data for file ID {file_id}")
        return None
    
    # Generate test headings
    strength_headings = [
        "Strategic thinking",
        "Leadership",
        "Communication",
        "Technical expertise",
        "Problem solving"
    ]
    
    area_headings = [
        "Delegation",
        "Work-life balance",
        "Public speaking",
        "Networking",
        "Time management"
    ]
    
    # Test strengths sorting
    print("\n[TEST 1] Testing strengths sorting with parallel implementation...")
    strengths_start = time.time()
    strengths_result = await process_batches_parallel(feedback_data["strengths"], strength_headings, batch_size=1, is_strengths=True)
    strengths_time = time.time() - strengths_start
    
    # Count evidence items in the result
    strengths_evidence_count = sum(len(item.get("evidence", [])) for item in strengths_result)
    print(f"[TEST 1] Processed {len(feedback_data['strengths'])} stakeholders with {sum(len(data.get('feedback', [])) for data in feedback_data['strengths'].values())} feedback items")
    print(f"[TEST 1] Generated {len(strengths_result)} strength headings with {strengths_evidence_count} total evidence items")
    print(f"[TEST 1] Completed in {strengths_time:.2f} seconds")
    
    # Test areas sorting
    print("\n[TEST 2] Testing areas sorting with parallel implementation...")
    areas_start = time.time()
    areas_result = await process_batches_parallel(feedback_data["areas_to_target"], area_headings, batch_size=2, is_strengths=False)
    areas_time = time.time() - areas_start
    
    # Count evidence items in the result
    areas_evidence_count = sum(len(item.get("evidence", [])) for item in areas_result)
    print(f"[TEST 2] Processed {len(feedback_data['areas_to_target'])} stakeholders with {sum(len(data.get('feedback', [])) for data in feedback_data['areas_to_target'].values())} feedback items")
    print(f"[TEST 2] Generated {len(areas_result)} area headings with {areas_evidence_count} total evidence items")
    print(f"[TEST 2] Completed in {areas_time:.2f} seconds")
    
    # Calculate total time
    total_time = strengths_time + areas_time
    
    print("="*80)
    print(f"SORTING PERFORMANCE TEST COMPLETE: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Total processing time: {total_time:.2f} seconds")
    print(f"- Strengths sorting: {strengths_time:.2f}s ({strengths_time/total_time*100:.1f}%)")
    print(f"- Areas sorting: {areas_time:.2f}s ({areas_time/total_time*100:.1f}%)")
    print("="*80)
    
    # Save the results
    results = {
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "file_id": file_id,
        "config": {
            "max_concurrent_api_calls": MAX_CONCURRENT_API_CALLS
        },
        "strengths_sorting": {
            "time": strengths_time,
            "stakeholders_count": len(feedback_data["strengths"]),
            "feedback_items": sum(len(data.get("feedback", [])) for data in feedback_data["strengths"].values()),
            "headings_count": len(strengths_result),
            "evidence_count": strengths_evidence_count
        },
        "areas_sorting": {
            "time": areas_time,
            "stakeholders_count": len(feedback_data["areas_to_target"]),
            "feedback_items": sum(len(data.get("feedback", [])) for data in feedback_data["areas_to_target"].values()),
            "headings_count": len(areas_result),
            "evidence_count": areas_evidence_count
        }
    }
    
    # Save to file
    output_dir = os.path.join("output", "performance")
    os.makedirs(output_dir, exist_ok=True)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_path = os.path.join(output_dir, f"sorting_performance_{timestamp}.json")
    
    with open(output_path, "w") as f:
        json.dump(results, f, indent=2)
    
    print(f"Performance results saved to: {output_path}")
    
    return results

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Test performance of parallel sorting implementation.")
    parser.add_argument("--file-id", type=str, default="7ed8e3d5-9c28-48a4-a5fb-2bd6bb360131", help="File ID to process")
    
    args = parser.parse_args()
    
    # Run the async function
    asyncio.run(run_sorting_test(args.file_id))
