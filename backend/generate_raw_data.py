import anthropic
import json
import os
from generate_report_llm import parse_gpt_response, process_json



def get_strengths_data(transcript, strengths, api_key):
    client = anthropic.Anthropic(api_key=api_key)
    
    json_format = """
    {
        "strengths": {
            "[strength_category]": [
                {
                    "name": "",        // Full name of the person quoted
                    "role": "",        // Role/position of the person
                    "quotes": []       // Array of exact quotes from the transcript
                }
            ]
        }
    }
    """
    
    prompt = f"""Analyze this interview transcript and extract all relevant quotes that provide evidence for the following strengths.
Strengths to analyze:
{strengths}

Format the output as a JSON object following this structure:
{json_format}

Rules:
- Only include direct quotes from stakeholders
- Maintain exact wording from the transcript
- Include full name and role when available
- Group quotes by the same person under one entry
- Ensure quotes clearly support the specific strength
- Do not include interpretive comments or summaries

Please analyze this transcript and provide the evidence in the specified JSON format:
{transcript}
"""

    response = client.messages.create(
        model="claude-3-sonnet-20240229",
        max_tokens=4000,
        temperature=0,
        messages=[{
            "role": "user",
            "content": prompt
        }]
    )
    
    raw_data = response.content
    if isinstance(raw_data, list) and len(raw_data) > 0 and hasattr(raw_data[0], 'text'):
        json_str = raw_data[0].text
    else:
        json_str = raw_data
        
    try:
        parsed_data = parse_gpt_response(json_str.replace("\n",""))
        if parsed_data:
            return parsed_data
        else:
            print("\nNo valid JSON structure found in the response.")
            return {"error": "No valid JSON structure found", "raw_response": json_str}
    except Exception as e:
        print(f"\nError processing response: {str(e)}")
        print("Raw response content:")
        print(json_str)
        return {"error": str(e), "raw_response": json_str}

def get_areas_to_target_data(transcript, areas_to_target, api_key):
    client = anthropic.Anthropic(api_key=api_key)
    
    json_format = """
    {
        "areas_to_target": {
            "[area_category]": [
                {
                    "name": "",        // Full name of the person quoted
                    "role": "",        // Role/position of the person
                    "quotes": []       // Array of exact quotes from the transcript
                }
            ]
        }
    }
    """
    
    prompt = f"""Analyze this interview transcript and extract all relevant quotes that provide evidence for the following areas that need improvement.
Areas to target to analyze:
{areas_to_target}

Format the output as a JSON object following this structure:
{json_format}

Rules:
- Only include direct quotes from stakeholders
- Maintain exact wording from the transcript
- Include full name and role when available
- Group quotes by the same person under one entry
- Ensure quotes clearly support the specific area to target
- Do not include interpretive comments or summaries

Please analyze this transcript and provide the evidence in the specified JSON format:
{transcript}
"""

    response = client.messages.create(
        model="claude-3-sonnet-20240229",
        max_tokens=4000,
        temperature=0,
        messages=[{
            "role": "user",
            "content": prompt
        }]
    )
    
    raw_data = response.content
    if isinstance(raw_data, list) and len(raw_data) > 0 and hasattr(raw_data[0], 'text'):
        json_str = raw_data[0].text
    else:
        json_str = raw_data
        
    try:
        parsed_data = parse_gpt_response(json_str.replace("\n",""))
        if parsed_data:
            return parsed_data
        else:
            print("\nNo valid JSON structure found in the response.")
            return {"error": "No valid JSON structure found", "raw_response": json_str}
    except Exception as e:
        print(f"\nError processing response: {str(e)}")
        print("Raw response content:")
        print(json_str)
        return {"error": str(e), "raw_response": json_str}








def get_raw_data(transcript, strengths, areas_to_target, api_key):
    client = anthropic.Anthropic(api_key=api_key)
    
    json_format = """
    {
        "strengths": {
            "[strength_category]": [
                {
                    "name": "",        // Full name of the person quoted
                    "role": "",        // Role/position of the person
                    "quotes": []       // Array of exact quotes from the transcript
                }
            ]
        },
        "areas_to_target": {
            "[area_category]": [
                {
                    "name": "",        // Full name of the person quoted
                    "role": "",        // Role/position of the person
                    "quotes": []       // Array of exact quotes from the transcript
                }
            ]
        }
    }
    """
    prompt = f"""Analyze this interview transcript and extract all relevant quotes that provide evidence for the following strengths and areas to target.
Strengths to analyze:
{strengths}
Areas to target to analyze:
{areas_to_target}
Format the output as a JSON object following this structure:
{json_format}
Rules:
- Only include direct quotes from stakeholders
- Maintain exact wording from the transcript
- Include full name and role when available
- Group quotes by the same person under one entry
- Ensure quotes clearly support the specific strength or area to target
- Do not include interpretive comments or summaries
Please analyze this transcript and provide the evidence in the specified JSON format:
{transcript}
"""
    response = client.messages.create(
        model="claude-3-sonnet-20240229",
        max_tokens=4000,
        temperature=0,
        messages=[{
            "role": "user",
            "content": prompt
        }]
    )
    raw_data = response.content

    # The response is a list of TextBlock objects, so we need to extract the text from the first one
    if isinstance(raw_data, list) and len(raw_data) > 0 and hasattr(raw_data[0], 'text'):
        json_str = raw_data[0].text
    else:
        json_str = raw_data  # Fallback to using raw_data as is

    try:
        parsed_data = parse_gpt_response(json_str)
        if parsed_data:
            return parsed_data
        else:
            print("\nNo valid JSON structure found in the response.")
            return {"error": "No valid JSON structure found", "raw_response": json_str}
    except Exception as e:
        print(f"\nError processing response: {str(e)}")
        print("Raw response content:")
        print(json_str)
        return {"error": str(e), "raw_response": json_str}


# The rest of your code remains the same

def main():
    # Get API key from environment variable
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        print("Error: ANTHROPIC_API_KEY environment variable not set")
        return

    # Sample transcript (replace with a real transcript for testing)
    transcript = """
    John Doe (Manager): I've been really impressed with Jane's leadership skills. She always takes initiative on projects.
    Jane Smith (Team Lead): I try to encourage my team members to think creatively and take ownership of their work.
    Mike Johnson (Colleague): Sometimes Jane can be a bit too hands-off. I think she could provide more direct guidance.
    """

    # Sample strengths and areas to target
    strengths = {
        "Leadership": "Demonstrates strong leadership skills and initiative",
        "Team Development": "Encourages creativity and ownership in team members"
    }
    areas_to_target = {
        "Guidance": "Could provide more direct guidance to team members"
    }

    # Get raw data
    raw_data = get_raw_data(transcript, strengths, areas_to_target, api_key)

    # Print the raw data
    print("Raw response:")
    print(raw_data)

    # Try to extract and parse JSON from the response
    

if __name__ == "__main__":
    main()