import os
import sys
import json
import time
import anthropic
import argparse
from datetime import datetime

# Add the parent directory to the path so we can import from backend
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import the necessary modules
from utils.loggers.feedback_logger import feedbackLogger
from routers.feedback import (
    identify_stakeholders,
    process_stakeholders_parallel,
    process_batches_parallel,
    format_final_result,
    MAX_CONCURRENT_API_CALLS,
    MAX_API_CALLS_PER_MINUTE,
    STAKEHOLDER_BATCH_SIZE
)
from dir_config import SAVE_DIR
import env_variables

async def run_parallel_test(file_id):
    """Run the feedback extraction flow using the parallel implementation."""
    print("="*80)
    print(f"STARTING PARALLEL FEEDBACK EXTRACTION TEST: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Using max concurrent API calls: {MAX_CONCURRENT_API_CALLS}")
    print(f"Using stakeholder batch size: {STAKEHOLDER_BATCH_SIZE}")
    print(f"Using max API calls per minute: {MAX_API_CALLS_PER_MINUTE}")
    print("="*80)
    
    # Initialize Claude client
    client = anthropic.Anthropic(api_key=env_variables.ANTHROPIC_API_KEY)
    
    # Read the file content
    # Try different possible locations for the file
    possible_paths = [
        os.path.join("../data/processed_assessments", f"filtered_{file_id}.txt"),
        os.path.join("../../data/processed_assessments", f"filtered_{file_id}.txt"),
        os.path.join("../tests/output/stages", f"stage1_{file_id}.json"),
        os.path.join("output/stages", f"stage1_{file_id}.json")
    ]
    
    filtered_file = None
    for path in possible_paths:
        if os.path.exists(path):
            filtered_file = path
            break
    
    if not filtered_file:
        print(f"Error: Could not find filtered file for ID {file_id}")
        print(f"Tried paths: {', '.join(possible_paths)}")
        
        # Use a default file from the stages directory
        stage_files = [f for f in os.listdir("output/stages") if f.startswith("stage1_")]
        if stage_files:
            default_file = os.path.join("output/stages", stage_files[0])
            print(f"Using default file: {default_file}")
            filtered_file = default_file
            # Extract file_id from the filename
            file_id = stage_files[0].split("_")[1].split(".")[0]
        else:
            print("No stage files found. Cannot proceed.")
            return None
    
    print(f"Using filtered file: {filtered_file}")
    with open(filtered_file, "r") as f:
        feedback_transcript = f.read()
    
    # Stage 1: Identify stakeholders
    print("\n[STAGE 1] Identifying stakeholders...")
    stage1_start = time.time()
    stakeholders = identify_stakeholders(feedback_transcript, client)
    stage1_time = time.time() - stage1_start
    print(f"[STAGE 1] Found {len(stakeholders)} stakeholders in {stage1_time:.2f} seconds")
    
    # Stage 2: Extract feedback per stakeholder (parallel)
    print("\n[STAGE 2] Extracting feedback for all stakeholders in parallel...")
    stage2_start = time.time()
    stakeholder_feedback = await process_stakeholders_parallel(stakeholders, feedback_transcript, client)
    stage2_time = time.time() - stage2_start
    total_feedback_count = sum(len(feedback.get("feedback", [])) for feedback in stakeholder_feedback)
    print(f"[STAGE 2] Extracted {total_feedback_count} total feedback items in {stage2_time:.2f} seconds")
    
    # Stage 3: Categorize feedback (parallel)
    print("\n[STAGE 3] Categorizing feedback in parallel batches...")
    stage3_start = time.time()
    categorized_feedback = await process_batches_parallel(stakeholder_feedback, client, batch_size=STAKEHOLDER_BATCH_SIZE)
    stage3_time = time.time() - stage3_start
    
    # Count items in each category
    strengths_count = sum(len(data.get("feedback", [])) for data in categorized_feedback.get("strengths", {}).values())
    areas_count = sum(len(data.get("feedback", [])) for data in categorized_feedback.get("areas_to_target", {}).values())
    advice_count = sum(len(data.get("feedback", [])) for data in categorized_feedback.get("advice", {}).values())
    
    print(f"[STAGE 3] Categorized feedback: {strengths_count} strengths, {areas_count} areas to target, {advice_count} advice items in {stage3_time:.2f} seconds")
    
    # Stage 4: Format the final result
    print("\n[STAGE 4] Formatting results...")
    stage4_start = time.time()
    result = format_final_result(categorized_feedback)
    stage4_time = time.time() - stage4_start
    print(f"[STAGE 4] Formatted results in {stage4_time:.2f} seconds")
    
    # Calculate total time
    total_time = stage1_time + stage2_time + stage3_time + stage4_time
    
    print("="*80)
    print(f"PARALLEL FEEDBACK EXTRACTION TEST COMPLETE: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Total processing time: {total_time:.2f} seconds")
    print(f"- Stage 1 (Identify stakeholders): {stage1_time:.2f}s ({stage1_time/total_time*100:.1f}%)")
    print(f"- Stage 2 (Extract feedback): {stage2_time:.2f}s ({stage2_time/total_time*100:.1f}%)")
    print(f"- Stage 3 (Categorize feedback): {stage3_time:.2f}s ({stage3_time/total_time*100:.1f}%)")
    print(f"- Stage 4 (Format results): {stage4_time:.2f}s ({stage4_time/total_time*100:.1f}%)")
    print("="*80)
    
    # Save the results
    results = {
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "file_id": file_id,
        "config": {
            "max_concurrent_api_calls": MAX_CONCURRENT_API_CALLS,
            "stakeholder_batch_size": STAKEHOLDER_BATCH_SIZE,
            "max_api_calls_per_minute": MAX_API_CALLS_PER_MINUTE
        },
        "performance": {
            "total_time": total_time,
            "stage1_time": stage1_time,
            "stage2_time": stage2_time,
            "stage3_time": stage3_time,
            "stage4_time": stage4_time
        },
        "stats": {
            "stakeholders_count": len(stakeholders),
            "feedback_count": total_feedback_count,
            "strengths_count": strengths_count,
            "areas_count": areas_count,
            "advice_count": advice_count
        }
    }
    
    # Save to file
    output_dir = os.path.join("output", "performance")
    os.makedirs(output_dir, exist_ok=True)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_path = os.path.join(output_dir, f"parallel_performance_{timestamp}.json")
    
    with open(output_path, "w") as f:
        json.dump(results, f, indent=2)
    
    print(f"Performance results saved to: {output_path}")
    
    return results

if __name__ == "__main__":
    import asyncio
    
    parser = argparse.ArgumentParser(description="Test performance of parallel feedback extraction implementation.")
    parser.add_argument("--file-id", type=str, default="cbecdeff-1cf5-4734-b2a4-bf460c70c4d4", help="File ID to process")
    
    args = parser.parse_args()
    
    # Run the async function
    asyncio.run(run_parallel_test(args.file_id))
