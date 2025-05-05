import os
import sys
import json
import anthropic
import argparse
from datetime import datetime

# Add the parent directory to the path so we can import from backend
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import the necessary functions
from routers.feedback import (
    identify_stakeholders,
    extract_stakeholder_feedback,
    categorize_with_strength_assessment,
    format_final_result
)
from dir_config import SAVE_DIR
import env_variables

def save_stage_output(data, stage, file_id):
    """Save the output of a stage to a JSON file."""
    output_dir = os.path.join("output", "stages")
    os.makedirs(output_dir, exist_ok=True)
    
    output_path = os.path.join(output_dir, f"stage{stage}_{file_id}.json")
    
    with open(output_path, "w") as f:
        json.dump(data, f, indent=2)
    
    print(f"Stage {stage} output saved to: {output_path}")
    return output_path

def load_stage_output(stage, file_id):
    """Load the output of a stage from a JSON file."""
    input_path = os.path.join("output", "stages", f"stage{stage}_{file_id}.json")
    
    if not os.path.exists(input_path):
        print(f"Stage {stage} output file not found: {input_path}")
        return None
    
    with open(input_path, "r") as f:
        data = json.load(f)
    
    print(f"Stage {stage} output loaded from: {input_path}")
    return data

def run_test(start_stage=1, end_stage=4, file_id="7ed8e3d5-9c28-48a4-a5fb-2bd6bb360131"):
    """Run the feedback extraction flow on the specified filtered file, with options to start and end at specific stages."""
    # When running from the tests directory, we need to adjust the path
    # SAVE_DIR is "../data/processed_assessments" relative to backend directory
    # But we're in backend/tests, so we need to go up one more level
    filtered_file = os.path.join("../../data/processed_assessments", f"filtered_{file_id}.txt")
    
    print("="*80)
    print(f"STARTING FEEDBACK EXTRACTION TEST: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Running stages {start_stage} to {end_stage}")
    print("="*80)
    
    # Initialize Claude client
    client = anthropic.Anthropic(api_key=env_variables.ANTHROPIC_API_KEY)
    
    print(f"Using filtered file: {filtered_file}")
    print(f"File ID: {file_id}")
    
    # Variables to store stage outputs
    stakeholders = None
    stakeholder_feedback = None
    categorized_feedback = None
    result = None
    
    # Read the file content if needed for early stages
    feedback_transcript = None
    if start_stage <= 1:
        with open(filtered_file, "r") as f:
            feedback_transcript = f.read()
    
    # Stage 1: Identify stakeholders
    if start_stage <= 1 and end_stage >= 1:
        print("\n[STAGE 1] Identifying stakeholders...")
        stakeholders = identify_stakeholders(feedback_transcript, client)
        print(f"[STAGE 1] Found {len(stakeholders)} stakeholders:")
        for i, s in enumerate(stakeholders):
            print(f"  {i+1}. {s.get('name', 'Unknown')} - {s.get('role', 'Unknown role')}")
        
        # Save Stage 1 output
        save_stage_output(stakeholders, 1, file_id)
    elif start_stage > 1:
        # Load Stage 1 output if starting from a later stage
        stakeholders = load_stage_output(1, file_id)
        if not stakeholders:
            print("[ERROR] Cannot proceed without Stage 1 output. Please run Stage 1 first.")
            return
    
    # Stage 2: Extract feedback per stakeholder
    if start_stage <= 2 and end_stage >= 2:
        # Load the transcript if not already loaded
        if not feedback_transcript:
            with open(filtered_file, "r") as f:
                feedback_transcript = f.read()
        
        print("\n[STAGE 2] Extracting feedback per stakeholder...")
        stakeholder_feedback = []
        for i, stakeholder in enumerate(stakeholders):
            print(f"  [STAGE 2.{i+1}] Processing stakeholder: {stakeholder['name']} ({i+1}/{len(stakeholders)})")
            feedback = extract_stakeholder_feedback(stakeholder, feedback_transcript, client)
            
            # Verify that the stakeholder name and role are preserved correctly
            if feedback.get("name") != stakeholder["name"]:
                print(f"  [ERROR] Stakeholder name mismatch: expected '{stakeholder['name']}', got '{feedback.get('name')}'")
            if feedback.get("role") != stakeholder["role"]:
                print(f"  [ERROR] Stakeholder role mismatch: expected '{stakeholder['role']}', got '{feedback.get('role')}'")
            
            feedback_count = len(feedback.get("feedback", []))
            print(f"  [STAGE 2.{i+1}] Extracted {feedback_count} feedback items")
            stakeholder_feedback.append(feedback)
        
        # Save Stage 2 output
        save_stage_output(stakeholder_feedback, 2, file_id)
    elif start_stage > 2:
        # Load Stage 2 output if starting from a later stage
        stakeholder_feedback = load_stage_output(2, file_id)
        if not stakeholder_feedback:
            print("[ERROR] Cannot proceed without Stage 2 output. Please run Stage 2 first.")
            return
    
    # Stage 3: Categorize feedback and assess strength
    if start_stage <= 3 and end_stage >= 3:
        print("\n[STAGE 3] Categorizing feedback and assessing strength...")
        categorized_feedback = categorize_with_strength_assessment(stakeholder_feedback, client)
        
        # Count items in each category
        strengths_count = sum(len(data.get("feedback", [])) for data in categorized_feedback.get("strengths", {}).values())
        areas_count = sum(len(data.get("feedback", [])) for data in categorized_feedback.get("areas_to_target", {}).values())
        advice_count = sum(len(data.get("feedback", [])) for data in categorized_feedback.get("advice", {}).values())
        
        print(f"[STAGE 3] Categorized feedback: {strengths_count} strengths, {areas_count} areas to target, {advice_count} advice items")
        
        # Save Stage 3 output
        save_stage_output(categorized_feedback, 3, file_id)
    elif start_stage > 3:
        # Load Stage 3 output if starting from a later stage
        categorized_feedback = load_stage_output(3, file_id)
        if not categorized_feedback:
            print("[ERROR] Cannot proceed without Stage 3 output. Please run Stage 3 first.")
            return
    
    # Stage 4: Format the final result
    if start_stage <= 4 and end_stage >= 4:
        print("\n[STAGE 4] Formatting results...")
        result = format_final_result(categorized_feedback)
        
        # Save Stage 4 output
        save_stage_output(result, 4, file_id)
        
        # Save the test results with timestamp
        test_output_dir = os.path.join("output")  # We're already in the tests directory
        os.makedirs(test_output_dir, exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_path = os.path.join(test_output_dir, f"test_result_{timestamp}.json")
        
        with open(output_path, "w") as f:
            json.dump(result, f, indent=2)
        
        print(f"Test results saved to: {output_path}")
    
    print("="*80)
    print(f"FEEDBACK EXTRACTION TEST COMPLETE: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*80)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run feedback extraction test with options to start and end at specific stages.")
    parser.add_argument("--start", type=int, default=1, choices=[1, 2, 3, 4], help="Stage to start from (1-4)")
    parser.add_argument("--end", type=int, default=4, choices=[1, 2, 3, 4], help="Stage to end at (1-4)")
    parser.add_argument("--file-id", type=str, default="7ed8e3d5-9c28-48a4-a5fb-2bd6bb360131", help="File ID to process")
    
    args = parser.parse_args()
    
    run_test(start_stage=args.start, end_stage=args.end, file_id=args.file_id)
