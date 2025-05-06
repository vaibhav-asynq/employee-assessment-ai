import os
import sys
import json
import argparse
from datetime import datetime
import asyncio

# Add the parent directory to the path so we can import from backend
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import the necessary functions
from generate_report_llm import process_prompts
import env_variables

async def test_special_name_processing(pdf_path, output_dir="output"):
    """
    Test the special name processing feature with a PDF file.
    
    Args:
        pdf_path: Path to the PDF file to process
        output_dir: Directory to save the output
    """
    print("="*80)
    print(f"STARTING SPECIAL NAME PROCESSING TEST: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Processing PDF: {pdf_path}")
    print("="*80)
    
    # Extract the text content from the PDF
    # You can use the existing pdf_to_text.py script or implement it here
    from process_pdf import extract_text_from_pdf
    text_content = extract_text_from_pdf(pdf_path)
    
    # Get the executive interview section (assuming it's the first part of the text)
    # This is a simplification - you might need to adjust based on your PDF structure
    executive_interview = text_content[:5000]  # Take the first 5000 characters as the executive interview
    
    # Process the prompts with the PDF path for name extraction
    system_prompt = "You are a helpful assistant that analyzes feedback and generates reports."
    
    print("Processing prompts...")
    report_data = await process_prompts(
        feedback_content=text_content,
        executive_interview=executive_interview,
        api_key=env_variables.ANTHROPIC_API_KEY,
        system_prompt=system_prompt,
        pdf_path=pdf_path  # Pass the PDF path for name extraction
    )
    
    # Create the output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)
    
    # Save the results to a file
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_path = os.path.join(output_dir, f"special_name_test_{timestamp}.json")
    
    with open(output_path, "w") as f:
        json.dump(report_data, f, indent=2)
    
    print(f"Test results saved to: {output_path}")
    
    # Check if special name processing was applied
    employee_name = report_data.get("name")
    if employee_name:
        print(f"Employee name extracted: {employee_name}")
        
        # Check if this is a special name
        from special_name_processor import check_special_name
        if check_special_name(employee_name):
            print(f"Special name detected: {employee_name}")
            print("Special name processing was applied to the report.")
        else:
            print(f"{employee_name} is not in the special names list.")
            print("Regular processing was applied to the report.")
    else:
        print("No employee name was extracted from the PDF.")
    
    print("="*80)
    print(f"SPECIAL NAME PROCESSING TEST COMPLETE: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*80)
    
    return report_data, output_path

def main():
    parser = argparse.ArgumentParser(description="Test the special name processing feature with a PDF file.")
    parser.add_argument("pdf_path", help="Path to the PDF file to process")
    parser.add_argument("--output-dir", default="output", help="Directory to save the output")
    
    args = parser.parse_args()
    
    # Run the test
    asyncio.run(test_special_name_processing(args.pdf_path, args.output_dir))

if __name__ == "__main__":
    main()
