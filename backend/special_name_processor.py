import json
import asyncio
from anthropic import Anthropic
from typing import Dict, Optional

# List of special names that require custom processing
SPECIAL_NAMES = ["Ian Fujiyama", "Kelly Vohs", "Pam Cain", "Martin Sumner"]

def check_special_name(name: str) -> bool:
    """Check if a name is in the special names list."""
    return name in SPECIAL_NAMES

def load_special_json(name: str) -> dict:
    """Load JSON file for special name processing."""
    # Convert name to lowercase and replace space with underscore
    filename = name.lower().replace(" ", "_")
    file_path = f"special_json/{filename}.json"
    
    try:
        with open(file_path, 'r') as file:
            return json.load(file)
    except Exception as e:
        print(f"Error loading special JSON for {name}: {str(e)}")
        return {}

def get_special_prompt(report_json: dict) -> str:
    """Create prompt for special name processing."""
    return f"""Given a report of 360 assessment:
{json.dumps(report_json, indent=2)}

Maintain exactly the same structure and language patterns as in the report, but use slightly different wording.
Return the result in the same JSON format.
"""

def parse_gpt_response(response_text: str) -> dict:
    """Parse GPT response to extract JSON."""
    try:
        # Find JSON content between triple backticks
        import re
        json_match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', response_text)
        if json_match:
            json_str = json_match.group(1)
        else:
            # If no backticks, try to find JSON directly
            start_idx = response_text.find('{')
            end_idx = response_text.rfind('}') + 1
            if start_idx >= 0 and end_idx > start_idx:
                json_str = response_text[start_idx:end_idx]
            else:
                return {}
        
        return json.loads(json_str)
    except Exception as e:
        print(f"Error parsing GPT response: {str(e)}")
        return {}

async def process_special_name_report(client: Anthropic, name: str, report_data: dict, system_prompt: str) -> dict:
    """
    Process special name case if the name is in the special list.
    
    Args:
        client: Anthropic client
        name: Employee name
        report_data: Original report data
        system_prompt: System prompt for the LLM
        
    Returns:
        Modified report data if name is special, otherwise original report data
    """
    # If name is not special, return original data
    if not check_special_name(name):
        return report_data
    
    # Load special JSON for this name
    special_json = load_special_json(name)
    if not special_json:
        print(f"No special JSON found for {name}, returning original report")
        return report_data
    
    # Create prompt for special processing
    prompt = get_special_prompt(special_json)
    
    try:
        # Process the prompt using run_in_executor like in generate_report_llm.py
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            lambda: client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=4000,
                temperature=0.0,
                messages=[{"role": "user", "content": prompt}],
                system=system_prompt
            )
        )
        
        # Parse and return the modified results
        modified_result = parse_gpt_response(response.content[0].text)
        print(f"Successfully processed special report for {name}")
        return modified_result
    except Exception as e:
        print(f"Error processing special name {name}: {str(e)}")
        return report_data  # Return original results if processing fails

async def check_and_process_special_names(report_data: dict, api_key: str, system_prompt: str) -> dict:
    """
    Check if the report is for a special name and process it accordingly.
    
    Args:
        report_data: Original report data
        api_key: Anthropic API key
        system_prompt: System prompt for the LLM
        
    Returns:
        Modified report data if name is special, otherwise original report data
    """
    # Extract employee name from report data
    employee_name = report_data.get("name")
    
    # If no name or not a special name, return original data
    if not employee_name or not check_special_name(employee_name):
        return report_data
    
    # Initialize Anthropic client
    client = Anthropic(api_key=api_key)
    
    # Process special name report
    return await process_special_name_report(client, employee_name, report_data, system_prompt)
