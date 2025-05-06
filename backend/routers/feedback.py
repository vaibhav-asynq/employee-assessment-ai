import json
import os
import re
import difflib
from string import Template
from typing import Dict, List, Any, Optional, Tuple

import anthropic
import env_variables
from auth.user import User, get_current_user
from db.core import get_db
from db.feedback import FeedBackCreate, create_feedback, get_cached_feedback
from db.file import get_task_by_user_and_fileId
from dir_config import SAVE_DIR
from fastapi import APIRouter, HTTPException, Query, Request
from fastapi.params import Depends
from prompt_loader import load_prompt
from sqlalchemy.orm import Session

router = APIRouter(
    prefix="",
)


def identify_stakeholders(transcript: str, client: anthropic.Anthropic) -> List[Dict[str, str]]:
    """
    Stage 1: Identify all stakeholders who provided feedback in the transcript.
    
    Args:
        transcript: The full transcript text
        client: The Anthropic client for API calls
        
    Returns:
        A list of dictionaries containing stakeholder information, excluding coaches and facilitators
    """
    # Load the prompt
    prompt_text = load_prompt("feedback_identify_stakeholders.txt")
    
    # Use Template instead of format to avoid issues with curly braces in JSON examples
    template = Template(prompt_text)
    updated_prompt = template.substitute(feedback=transcript)
    
    # Call Claude API
    response = client.messages.create(
        model="claude-3-7-sonnet-latest",
        max_tokens=2000,
        temperature=0,
        messages=[
            {
                "role": "user",
                "content": updated_prompt
            }
        ]
    )
    response_text = response.content[0].text
    
    print(f"[DEBUG] Raw response from identify_stakeholders: {response_text}")
    
    # Default structure in case parsing fails
    stakeholders = [{"name": "Unknown", "role": ""}]
    
    # Try to extract JSON array using our enhanced function
    result = extract_json_from_text(response_text)
    if result and isinstance(result, list):
        stakeholders = result
        print("[DEBUG] Successfully parsed stakeholders JSON using enhanced extraction")
    elif result and isinstance(result, dict) and "name" in result and "role" in result:
        # Handle case where we got a single stakeholder as a dict instead of a list
        stakeholders = [result]
        print("[DEBUG] Successfully parsed single stakeholder JSON using enhanced extraction")
    else:
        print("[DEBUG] Enhanced JSON extraction failed or returned non-list, trying special cases")
        
        # Special case handling for the specific error we're seeing
        if response_text.strip().startswith('"name"') or response_text.strip().startswith('"name"'):
            print("[DEBUG] Detected response starting with 'name', attempting to fix...")
            try:
                # Try to wrap the response in square brackets
                fixed_text = "[{" + response_text.strip() + "}]"
                stakeholders = json.loads(fixed_text)
                print("[DEBUG] Successfully fixed and parsed JSON with name prefix")
            except json.JSONDecodeError as e:
                print(f"[DEBUG] Failed to fix name prefix: {str(e)}")
                
                # Try to manually construct the JSON as a last resort
                try:
                    # Look for name/role patterns
                    name_matches = re.findall(r'"name"\s*:\s*"([^"]+)"', response_text)
                    role_matches = re.findall(r'"role"\s*:\s*"([^"]+)"', response_text)
                    
                    if len(name_matches) == len(role_matches) and len(name_matches) > 0:
                        manual_stakeholders = []
                        for i in range(len(name_matches)):
                            manual_stakeholders.append({
                                "name": name_matches[i],
                                "role": role_matches[i]
                            })
                        stakeholders = manual_stakeholders
                        print(f"[DEBUG] Successfully constructed {len(stakeholders)} stakeholders manually")
                    else:
                        print("[DEBUG] Using default stakeholders structure")
                except Exception as e4:
                    print(f"[DEBUG] Manual stakeholders construction failed: {str(e4)}")
                    print("[DEBUG] Using default stakeholders structure")
    
    # The prompt now excludes coaches, but we'll do a basic check just in case
    filtered_stakeholders = []
    coach_keywords = ["coach", "facilitator", "administrator", "feedback provider", "consultant", "advisor"]
    
    for stakeholder in stakeholders:
        role = stakeholder.get("role", "").lower()
        name = stakeholder.get("name", "").lower()
        
        # Check if the stakeholder is a coach based on role or name
        is_coach = any(keyword in role for keyword in coach_keywords)
        
        # Also check for "next steps" or similar sections that aren't from actual stakeholders
        is_meta_section = "next step" in name.lower() or "action" in name.lower()
        
        if not (is_coach or is_meta_section):
            filtered_stakeholders.append(stakeholder)
        else:
            print(f"Additional filtering - excluding: {stakeholder.get('name', 'Unknown')} - {stakeholder.get('role', 'Unknown role')}")
    
    print(f"After filtering: {len(filtered_stakeholders)} stakeholders remain")
    return filtered_stakeholders


def extract_stakeholder_feedback(stakeholder: Dict[str, str], transcript: str, client: anthropic.Anthropic) -> Dict[str, Any]:
    """
    Stage 2: Extract all feedback provided by a specific stakeholder.
    
    Args:
        stakeholder: Dictionary containing stakeholder information
        transcript: The full transcript text
        client: The Anthropic client for API calls
        
    Returns:
        A dictionary with the stakeholder's feedback
    """
    name = stakeholder["name"]
    role = stakeholder["role"]
    
    # Load the prompt
    prompt_text = load_prompt("feedback_extract_stakeholder.txt")
    
    # Use Template instead of format to avoid issues with curly braces in JSON examples
    template = Template(prompt_text)
    formatted_prompt = template.substitute(
        name=name,
        role=role,
        feedback=transcript
    )
    
    # Call Claude API
    response = client.messages.create(
        model="claude-3-7-sonnet-latest",
        max_tokens=3000,
        temperature=0,
        messages=[
            {
                "role": "user",
                "content": formatted_prompt
            }
        ]
    )
    
    response_text = response.content[0].text
    
    print(f"[DEBUG] Raw response from extract_stakeholder_feedback for {name}: {response_text}")
    
    # Default structure in case parsing fails
    feedback_data = {
        "name": name,
        "role": role,
        "feedback": []
    }
    
    # Use our enhanced JSON extraction and repair function
    result = extract_json_from_text(response_text)
    if result:
        feedback_data = result
        print(f"[DEBUG] Successfully parsed JSON using enhanced extraction for {name}")
    else:
        print(f"[DEBUG] Enhanced JSON extraction failed for {name}, using default structure")
    
    # Replace any placeholder values with actual values
    if feedback_data.get("name") == "{name}":
        feedback_data["name"] = name
    if feedback_data.get("role") == "{role}":
        feedback_data["role"] = role
    
    # Ensure required fields exist
    if "name" not in feedback_data:
        feedback_data["name"] = name
    if "role" not in feedback_data:
        feedback_data["role"] = role
    if "feedback" not in feedback_data:
        feedback_data["feedback"] = []
    
    return feedback_data


def categorize_with_strength_assessment(stakeholder_feedback: List[Dict[str, Any]], client: anthropic.Anthropic) -> Dict[str, Any]:
    """
    Stage 3: Categorize feedback and assess strength.
    
    Args:
        stakeholder_feedback: List of dictionaries with stakeholder feedback
        client: The Anthropic client for API calls
        
    Returns:
        A dictionary with categorized feedback
    """
    # Initialize the result structure
    categorized_data = {
        "strengths": {},
        "areas_to_target": {},
        "advice": {}
    }
    
    # Process stakeholders in batches of 2 to reduce complexity
    batch_size = 2
    total_stakeholders = len(stakeholder_feedback)
    
    print(f"[DEBUG] Processing {total_stakeholders} stakeholders in batches of {batch_size}")
    
    # Process stakeholders in batches
    for i in range(0, total_stakeholders, batch_size):
        batch_end = min(i + batch_size, total_stakeholders)
        current_batch = stakeholder_feedback[i:batch_end]
        
        print(f"[DEBUG] Processing batch {i//batch_size + 1}: stakeholders {i+1} to {batch_end} of {total_stakeholders}")
        
        # Process this batch
        batch_result = categorize_stakeholder_batch(current_batch, client)
        
        # Merge the batch result into the overall result
        merge_categorized_data(categorized_data, batch_result)
    
    # Ensure all required categories exist
    if "strengths" not in categorized_data:
        categorized_data["strengths"] = {}
    if "areas_to_target" not in categorized_data:
        categorized_data["areas_to_target"] = {}
    if "advice" not in categorized_data:
        categorized_data["advice"] = {}
    
    return categorized_data

def categorize_stakeholder_batch(stakeholder_batch: List[Dict[str, Any]], client: anthropic.Anthropic) -> Dict[str, Any]:
    """
    Process a batch of stakeholders for categorization.
    
    Args:
        stakeholder_batch: A subset of stakeholder feedback to process
        client: The Anthropic client for API calls
        
    Returns:
        A dictionary with categorized feedback for this batch
    """
    # Prepare the input for Claude
    input_data = json.dumps(stakeholder_batch, indent=2)
    
    # Load the prompt
    prompt_text = load_prompt("feedback_categorize.txt")
    
    # Use Template instead of format to avoid issues with curly braces in JSON examples
    template = Template(prompt_text)
    formatted_prompt = template.substitute(input_data=input_data)
    
    # Call Claude API
    response = client.messages.create(
        model="claude-3-7-sonnet-latest",
        max_tokens=4000,
        temperature=0,
        messages=[
            {
                "role": "user",
                "content": formatted_prompt
            }
        ]
    )
    
    response_text = response.content[0].text
    
    print(f"[DEBUG] Raw response from batch categorization: {response_text[:100]}...")
    print(f"[DEBUG] Response length: {len(response_text)} characters")
    
    # Default structure in case parsing fails
    batch_result = {
        "strengths": {},
        "areas_to_target": {},
        "advice": {}
    }
    
    # Use our enhanced JSON extraction and repair function
    result = extract_json_from_text(response_text)
    if result:
        # Ensure the result is a dictionary
        if isinstance(result, dict):
            batch_result = result
            print("[DEBUG] Successfully parsed batch JSON using enhanced extraction")
        else:
            print(f"[DEBUG] Extracted result is not a dictionary, but a {type(result)}")
    else:
        print("[DEBUG] Enhanced JSON extraction failed for batch, using default structure")
        
        # Special case handling for the specific error we're seeing
        if response_text.strip().startswith('"strengths"') or response_text.strip().startswith('"strengths"'):
            print("[DEBUG] Detected response starting with 'strengths', attempting to fix...")
            try:
                # Try to wrap the response in curly braces
                fixed_text = "{" + response_text.strip() + "}"
                batch_result = json.loads(fixed_text)
                print("[DEBUG] Successfully fixed and parsed JSON with strengths prefix")
            except json.JSONDecodeError as e:
                print(f"[DEBUG] Failed to fix strengths prefix: {str(e)}")
                
                # Try to manually construct the JSON as a last resort
                try:
                    # Look for key patterns
                    strengths_match = re.search(r'"strengths"\s*:\s*{(.+?)}', response_text, re.DOTALL)
                    areas_match = re.search(r'"areas_to_target"\s*:\s*{(.+?)}', response_text, re.DOTALL)
                    advice_match = re.search(r'"advice"\s*:\s*{(.+?)}', response_text, re.DOTALL)
                    
                    manual_json = "{"
                    if strengths_match:
                        manual_json += f'"strengths": {{{strengths_match.group(1)}}}'
                        if areas_match or advice_match:
                            manual_json += ","
                    if areas_match:
                        manual_json += f'"areas_to_target": {{{areas_match.group(1)}}}'
                        if advice_match:
                            manual_json += ","
                    if advice_match:
                        manual_json += f'"advice": {{{advice_match.group(1)}}}'
                    manual_json += "}"
                    
                    # Apply our JSON syntax fixer to the manually constructed JSON
                    fixed_manual_json = fix_json_syntax(manual_json)
                    batch_result = json.loads(fixed_manual_json)
                    print("[DEBUG] Successfully constructed and parsed manual JSON")
                except Exception as e4:
                    print(f"[DEBUG] Manual JSON construction failed: {str(e4)}")
    
    # Ensure all required categories exist
    if "strengths" not in batch_result:
        batch_result["strengths"] = {}
    if "areas_to_target" not in batch_result:
        batch_result["areas_to_target"] = {}
    if "advice" not in batch_result:
        batch_result["advice"] = {}
    
    return batch_result

def deduplicate_feedback(stakeholder_feedback: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Identify and resolve duplicate feedback across stakeholders.
    
    Args:
        stakeholder_feedback: List of dictionaries with stakeholder feedback
        
    Returns:
        Deduplicated stakeholder feedback
    """
    # Create a dictionary to track all feedback items
    all_feedback = {}
    
    # First pass: collect all feedback items with their stakeholders
    for stakeholder_data in stakeholder_feedback:
        stakeholder_name = stakeholder_data.get("name", "Unknown")
        for item in stakeholder_data.get("feedback", []):
            text = item.get("text", "").strip()
            if text:
                if text not in all_feedback:
                    all_feedback[text] = []
                all_feedback[text].append((stakeholder_name, item))
    
    # Second pass: identify potential duplicates using string similarity
    duplicates = []
    processed = set()
    
    for text1 in all_feedback:
        if text1 in processed:
            continue
            
        group = [text1]
        processed.add(text1)
        
        for text2 in all_feedback:
            if text2 in processed or text1 == text2:
                continue
                
            # Calculate similarity ratio
            similarity = difflib.SequenceMatcher(None, text1, text2).ratio()
            
            # If similarity is above threshold, consider it a duplicate
            if similarity > 0.85:  # 85% similarity threshold
                group.append(text2)
                processed.add(text2)
        
        if len(group) > 1:
            duplicates.append(group)
    
    # If no duplicates found, return original data
    if not duplicates:
        return stakeholder_feedback
    
    # Create a copy of the original data to modify
    result = []
    for stakeholder_data in stakeholder_feedback:
        new_stakeholder_data = {
            "name": stakeholder_data.get("name", "Unknown"),
            "role": stakeholder_data.get("role", ""),
            "feedback": []
        }
        
        # Only include non-duplicate feedback or the canonical version of duplicates
        for item in stakeholder_data.get("feedback", []):
            text = item.get("text", "").strip()
            
            # Check if this text is in a duplicate group
            is_duplicate = False
            for group in duplicates:
                if text in group and text != group[0]:  # Not the canonical version
                    is_duplicate = True
                    break
            
            if not is_duplicate:
                new_stakeholder_data["feedback"].append(item)
        
        result.append(new_stakeholder_data)
    
    return result

def validate_stakeholder_attribution(stakeholder_feedback: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Validate stakeholder attribution and flag unusual patterns.
    
    Args:
        stakeholder_feedback: List of dictionaries with stakeholder feedback
        
    Returns:
        Validated stakeholder feedback with warnings
    """
    # Calculate average feedback items per stakeholder
    total_items = sum(len(s.get("feedback", [])) for s in stakeholder_feedback)
    avg_items = total_items / len(stakeholder_feedback) if stakeholder_feedback else 0
    
    # Track stakeholders with unusual feedback counts
    unusual_counts = []
    
    # Check each stakeholder
    for stakeholder_data in stakeholder_feedback:
        name = stakeholder_data.get("name", "Unknown")
        feedback_count = len(stakeholder_data.get("feedback", []))
        
        # Flag stakeholders with unusually high or low feedback counts
        if feedback_count > avg_items * 2:
            print(f"[WARNING] Stakeholder '{name}' has unusually high feedback count: {feedback_count} (avg: {avg_items:.1f})")
            unusual_counts.append((name, feedback_count, "high"))
        elif feedback_count < avg_items * 0.5 and feedback_count > 0:
            print(f"[WARNING] Stakeholder '{name}' has unusually low feedback count: {feedback_count} (avg: {avg_items:.1f})")
            unusual_counts.append((name, feedback_count, "low"))
        elif feedback_count == 0:
            print(f"[WARNING] Stakeholder '{name}' has no feedback items")
            unusual_counts.append((name, feedback_count, "none"))
    
    # Check for identical feedback across stakeholders
    feedback_by_text = {}
    for stakeholder_data in stakeholder_feedback:
        name = stakeholder_data.get("name", "Unknown")
        for item in stakeholder_data.get("feedback", []):
            # Check if item is a dictionary or a string
            if isinstance(item, dict):
                text = item.get("text", "").strip()
            else:
                # Handle case where item is a string
                text = str(item).strip()
            if text:
                if text not in feedback_by_text:
                    feedback_by_text[text] = []
                feedback_by_text[text].append(name)
    
    # Flag feedback items that appear for multiple stakeholders
    duplicate_feedback = []
    for text, stakeholders in feedback_by_text.items():
        if len(stakeholders) > 1:
            print(f"[WARNING] Identical feedback found across multiple stakeholders: {', '.join(stakeholders)}")
            print(f"  Text: {text[:100]}...")
            duplicate_feedback.append((text, stakeholders))
    
    # Return the original data, as this is just a validation step
    return stakeholder_feedback

def analyze_sentiment(text: str) -> Dict[str, float]:
    """
    Analyze sentiment of text to help with categorization.
    
    Args:
        text: The text to analyze
        
    Returns:
        Dictionary with sentiment scores
    """
    # Initialize scores
    scores = {
        "strength": 0.0,
        "area_to_target": 0.0,
        "advice": 0.0
    }
    
    # Strength keywords
    strength_keywords = [
        "excellent", "exceptional", "outstanding", "impressive", "great", 
        "strong", "brilliant", "superb", "remarkable", "extraordinary",
        "talented", "skilled", "expert", "proficient", "adept",
        "accomplished", "successful", "effective", "efficient", "valuable"
    ]
    
    # Area to target keywords
    area_keywords = [
        "improve", "could", "should", "needs to", "would benefit from",
        "lacks", "missing", "insufficient", "inadequate", "limited",
        "challenge", "difficult", "struggle", "issue", "problem",
        "concern", "weakness", "gap", "opportunity", "development area"
    ]
    
    # Advice keywords
    advice_keywords = [
        "recommend", "suggest", "advise", "consider", "try",
        "might want to", "could benefit from", "would be better if",
        "next steps", "going forward", "in the future", "plan",
        "strategy", "approach", "method", "technique", "tactic"
    ]
    
    # Convert text to lowercase for case-insensitive matching
    lower_text = text.lower()
    
    # Check for strength keywords
    for keyword in strength_keywords:
        if keyword in lower_text:
            scores["strength"] += 1.0
    
    # Check for area to target keywords
    for keyword in area_keywords:
        if keyword in lower_text:
            scores["area_to_target"] += 1.0
    
    # Check for advice keywords
    for keyword in advice_keywords:
        if keyword in lower_text:
            scores["advice"] += 1.0
    
    # Normalize scores
    total = sum(scores.values())
    if total > 0:
        for key in scores:
            scores[key] /= total
    
    return scores

def merge_categorized_data(target: Dict[str, Any], source: Dict[str, Any]) -> None:
    """
    Merge source categorized data into target.
    
    Args:
        target: The target dictionary to merge into
        source: The source dictionary to merge from
    """
    # Merge strengths
    for stakeholder, data in source.get("strengths", {}).items():
        if stakeholder in target["strengths"]:
            # Stakeholder already exists, append feedback
            target["strengths"][stakeholder]["feedback"].extend(data.get("feedback", []))
        else:
            # New stakeholder, add to target
            target["strengths"][stakeholder] = data
    
    # Merge areas_to_target
    for stakeholder, data in source.get("areas_to_target", {}).items():
        if stakeholder in target["areas_to_target"]:
            # Stakeholder already exists, append feedback
            target["areas_to_target"][stakeholder]["feedback"].extend(data.get("feedback", []))
        else:
            # New stakeholder, add to target
            target["areas_to_target"][stakeholder] = data
    
    # Merge advice
    for stakeholder, data in source.get("advice", {}).items():
        if stakeholder in target["advice"]:
            # Stakeholder already exists, append feedback
            target["advice"][stakeholder]["feedback"].extend(data.get("feedback", []))
        else:
            # New stakeholder, add to target
            target["advice"][stakeholder] = data


def verify_extraction(categorized_feedback: Dict[str, Any], transcript: str, client: anthropic.Anthropic) -> Dict[str, Any]:
    """
    Stage 4: Verify the completeness of the extraction.
    
    Args:
        categorized_feedback: Dictionary with categorized feedback
        transcript: The full transcript text
        client: The Anthropic client for API calls
        
    Returns:
        A dictionary with verification results
    """
    # Prepare the input for Claude
    categorized_data = json.dumps(categorized_feedback, indent=2)
    
    # Load the prompt
    prompt_text = load_prompt("feedback_verify.txt")
    
    # Use Template instead of format to avoid issues with curly braces in JSON examples
    template = Template(prompt_text)
    formatted_prompt = template.substitute(
        categorized_data=categorized_data,
        feedback=transcript
    )
    
    # Call Claude API
    response = client.messages.create(
        model="claude-3-7-sonnet-latest",
        max_tokens=3000,
        temperature=0,
        messages=[
            {
                "role": "user",
                "content": formatted_prompt
            }
        ]
    )
    
    response_text = response.content[0].text
    
    print(f"[DEBUG] Raw response from verification: {response_text}")
    
    # Default structure in case parsing fails
    verification_data = {
        "missing_stakeholders": [],
        "missing_feedback": [],
        "miscategorized_feedback": []
    }
    
    # Use our enhanced JSON extraction and repair function
    result = extract_json_from_text(response_text)
    if result:
        verification_data = result
        print("[DEBUG] Successfully parsed verification JSON using enhanced extraction")
    else:
        print("[DEBUG] Enhanced JSON extraction failed for verification, using default structure")
    
    # Ensure all required fields exist
    if "missing_stakeholders" not in verification_data:
        verification_data["missing_stakeholders"] = []
    if "missing_feedback" not in verification_data:
        verification_data["missing_feedback"] = []
    if "miscategorized_feedback" not in verification_data:
        verification_data["miscategorized_feedback"] = []
    
    return verification_data


def add_missing_feedback(categorized_feedback: Dict[str, Any], missing_feedback: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Add missing feedback identified in the verification stage.
    
    Args:
        categorized_feedback: Dictionary with categorized feedback
        missing_feedback: List of missing feedback items
        
    Returns:
        Updated categorized feedback
    """
    result = categorized_feedback.copy()
    
    for item in missing_feedback:
        stakeholder = item.get("stakeholder", "Unknown")
        text = item.get("text", "")
        category = item.get("category", "strengths")
        
        # Skip if text is empty
        if not text:
            continue
        
        # Ensure the category exists
        if category not in result:
            result[category] = {}
        
        # Ensure the stakeholder exists in the category
        if stakeholder not in result[category]:
            result[category][stakeholder] = {
                "role": "",
                "feedback": []
            }
        
        # Add the feedback item
        result[category][stakeholder]["feedback"].append({
            "text": text,
            "is_strong": False  # Default to false for missing items
        })
    
    return result


def format_final_result(categorized_feedback: Dict[str, Any]) -> Dict[str, Any]:
    """
    Format the final result to match the expected output structure.
    
    Args:
        categorized_feedback: Dictionary with categorized feedback
        
    Returns:
        Formatted result
    """
    result = {
        "strengths": {},
        "areas_to_target": {}
    }
    
    # Process strengths
    for stakeholder, data in categorized_feedback.get("strengths", {}).items():
        result["strengths"][stakeholder] = {
            "role": data.get("role", ""),
            "feedback": data.get("feedback", [])
        }
    
    # Process areas to target
    for stakeholder, data in categorized_feedback.get("areas_to_target", {}).items():
        result["areas_to_target"][stakeholder] = {
            "role": data.get("role", ""),
            "feedback": data.get("feedback", [])
        }
    
    # Process advice - temporarily removed from final result
    # We still collect advice in categorized_feedback but don't include it in the result
    # for stakeholder, data in categorized_feedback.get("advice", {}).items():
    #     result["advice"][stakeholder] = {
    #         "role": data.get("role", ""),
    #         "feedback": data.get("feedback", [])
    #     }
    
    return result


def fix_json_syntax(json_str: str) -> str:
    """
    Fix common JSON syntax errors in LLM responses.
    
    Args:
        json_str: The JSON string to fix
        
    Returns:
        Fixed JSON string
    """
    # Remove any markdown code block markers
    json_str = re.sub(r'```json|```', '', json_str)
    
    # Fix missing commas between objects in arrays
    json_str = re.sub(r'}\s*{', '},{', json_str)
    
    # Fix missing commas between array items
    json_str = re.sub(r']\s*\[', '],[', json_str)
    
    # Fix trailing commas (not allowed in standard JSON)
    json_str = re.sub(r',\s*}', '}', json_str)
    json_str = re.sub(r',\s*]', ']', json_str)
    
    # Fix missing commas after property values before next property
    json_str = re.sub(r'"\s*"', '","', json_str)
    json_str = re.sub(r'(true|false|null)\s*"', r'\1,"', json_str)
    json_str = re.sub(r'(\d+)\s*"', r'\1,"', json_str)
    
    # Fix unescaped quotes in strings
    # This is a bit risky as it might change valid content, but it's a common error
    # json_str = re.sub(r'(?<!\\)"(?=.*".*:)', r'\"', json_str)
    
    # Fix missing quotes around property names
    json_str = re.sub(r'([{,])\s*([a-zA-Z0-9_]+)\s*:', r'\1"\2":', json_str)
    
    # Fix specific error with missing commas between properties
    # This pattern looks for a property value followed by a property name without a comma
    json_str = re.sub(r'(true|false|null|\d+|"[^"]*")\s+("?[a-zA-Z0-9_]+"?\s*:)', r'\1,\2', json_str)
    
    return json_str

def extract_json_from_text(text: str) -> Optional[Dict[str, Any]]:
    """
    Helper function to extract JSON from text with enhanced error recovery.
    
    Args:
        text: Text that may contain JSON
        
    Returns:
        Extracted JSON as a dictionary, or None if no JSON found
    """
    # First try to parse the text directly as JSON
    try:
        return json.loads(text)
    except json.JSONDecodeError as e:
        print(f"[DEBUG] Initial JSON parse error: {str(e)}")
    
    # Try to find and extract JSON object or array
    json_str = None
    
    # Look for JSON object
    start = text.find("{")
    end = text.rfind("}") + 1
    if start >= 0 and end > 0:
        json_str = text[start:end]
    
    # If no JSON object found, look for JSON array
    if not json_str:
        start = text.find("[")
        end = text.rfind("]") + 1
        if start >= 0 and end > 0:
            json_str = text[start:end]
    
    if not json_str:
        print("[DEBUG] No JSON-like structure found in text")
        return None
    
    # Try to parse the extracted JSON
    try:
        return json.loads(json_str)
    except json.JSONDecodeError as e:
        print(f"[DEBUG] Extracted JSON parse error: {str(e)}")
        
        # Try to fix common JSON syntax errors
        fixed_json = fix_json_syntax(json_str)
        
        try:
            return json.loads(fixed_json)
        except json.JSONDecodeError as e:
            print(f"[DEBUG] Fixed JSON parse error: {str(e)}")
            
            # If we still have errors, try a more aggressive approach
            # Split the JSON string into lines and analyze line by line
            lines = fixed_json.split('\n')
            error_line = e.lineno - 1  # JSON error line is 1-indexed
            
            if 0 <= error_line < len(lines):
                print(f"[DEBUG] Error in line: {lines[error_line]}")
                
                # Check if the error is a missing comma between properties
                if error_line > 0 and ":" not in lines[error_line] and ":" in lines[error_line-1]:
                    # Add a comma at the end of the previous line
                    lines[error_line-1] = lines[error_line-1] + ","
                    fixed_json = '\n'.join(lines)
                    
                    try:
                        return json.loads(fixed_json)
                    except json.JSONDecodeError:
                        pass
            
            # If all else fails, try to manually reconstruct the JSON
            try:
                # For objects, look for key-value patterns
                if json_str.strip().startswith('{'):
                    # Extract all key-value pairs using regex
                    pairs = re.findall(r'"([^"]+)"\s*:\s*("(?:\\.|[^"\\])*"|[^,}\s]+)', json_str)
                    if pairs:
                        result = {}
                        for key, value in pairs:
                            # Try to convert value to appropriate type
                            if value.lower() == 'true':
                                result[key] = True
                            elif value.lower() == 'false':
                                result[key] = False
                            elif value.lower() == 'null':
                                result[key] = None
                            elif value.startswith('"'):
                                # Remove quotes and handle escapes
                                result[key] = value[1:-1].replace('\\"', '"')
                            else:
                                # Try to convert to number
                                try:
                                    if '.' in value:
                                        result[key] = float(value)
                                    else:
                                        result[key] = int(value)
                                except ValueError:
                                    result[key] = value
                        return result
                
                # For arrays, split by commas and parse each item
                elif json_str.strip().startswith('['):
                    items = re.split(r',\s*', json_str.strip()[1:-1])
                    result = []
                    for item in items:
                        item = item.strip()
                        if item.lower() == 'true':
                            result.append(True)
                        elif item.lower() == 'false':
                            result.append(False)
                        elif item.lower() == 'null':
                            result.append(None)
                        elif item.startswith('"') and item.endswith('"'):
                            result.append(item[1:-1].replace('\\"', '"'))
                        else:
                            try:
                                if '.' in item:
                                    result.append(float(item))
                                else:
                                    result.append(int(item))
                            except ValueError:
                                result.append(item)
                    return result
            except Exception as e:
                print(f"[DEBUG] Manual JSON reconstruction failed: {str(e)}")
    
    return None


# here tasks will be created
@router.get("/api/get_feedback/{file_id}")
async def get_feedback(
    request: Request, 
    file_id: str,
    use_cache: bool = Query(
        True, description="Whether to use cached results if available"
    ),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) :
    user_id = current_user.user_id
    if(True):
        # Check cache first
        if use_cache:
            cached_data = get_cached_feedback(user_id, file_id, db)
            if cached_data:
                print(f"Using cached feedback for file ID {file_id}")
                return cached_data

        # If not cached or cache disabled, process normally
        db_task = get_task_by_user_and_fileId(user_id, file_id, db)
        
        # Get the feedback transcript
        feedback_path = os.path.join(SAVE_DIR, f"filtered_{file_id}.txt")
        if not os.path.exists(feedback_path):
            print(feedback_path)
            raise HTTPException(status_code=404, detail="Feedback transcript not found")

        with open(feedback_path, "r") as f:
            feedback_transcript = f.read()

        # Initialize Claude client
        client = anthropic.Anthropic(api_key=env_variables.ANTHROPIC_API_KEY)

        import time
        
        print("="*80)
        print(f"STARTING FEEDBACK EXTRACTION FOR FILE ID: {file_id}")
        print("="*80)
        
        # Stage 1: Identify stakeholders
        print("\n[STAGE 1] Identifying stakeholders...")
        start_time = time.time()
        stakeholders = identify_stakeholders(feedback_transcript, client)
        stage1_time = time.time() - start_time
        
        print(f"[STAGE 1] Found {len(stakeholders)} stakeholders:")
        for i, s in enumerate(stakeholders):
            print(f"  {i+1}. {s.get('name', 'Unknown')} - {s.get('role', 'Unknown role')}")
        print(f"[STAGE 1] Completed in {stage1_time:.2f} seconds")
        
        # Stage 2: Extract feedback per stakeholder
        print("\n[STAGE 2] Extracting feedback per stakeholder...")
        start_time = time.time()
        stakeholder_feedback = []
        for i, stakeholder in enumerate(stakeholders):
            print(f"  [STAGE 2.{i+1}] Processing stakeholder: {stakeholder['name']} ({i+1}/{len(stakeholders)})")
            s_start_time = time.time()
            feedback = extract_stakeholder_feedback(stakeholder, feedback_transcript, client)
            feedback_count = len(feedback.get("feedback", []))
            s_time = time.time() - s_start_time
            print(f"  [STAGE 2.{i+1}] Extracted {feedback_count} feedback items in {s_time:.2f} seconds")
            stakeholder_feedback.append(feedback)
        
        # Validate stakeholder attribution
        print("\n[STAGE 2.5] Validating stakeholder attribution...")
        s_start_time = time.time()
        validate_stakeholder_attribution(stakeholder_feedback)
        s_time = time.time() - s_start_time
        print(f"[STAGE 2.5] Validation completed in {s_time:.2f} seconds")
        
        # Deduplicate feedback
        print("\n[STAGE 2.6] Deduplicating feedback...")
        s_start_time = time.time()
        stakeholder_feedback = deduplicate_feedback(stakeholder_feedback)
        s_time = time.time() - s_start_time
        print(f"[STAGE 2.6] Deduplication completed in {s_time:.2f} seconds")
        
        stage2_time = time.time() - start_time
        print(f"[STAGE 2] Completed in {stage2_time:.2f} seconds")
        
        # Stage 3: Categorize feedback and assess strength
        print("\n[STAGE 3] Categorizing feedback and assessing strength...")
        start_time = time.time()
        categorized_feedback = categorize_with_strength_assessment(stakeholder_feedback, client)
        
        # Count items in each category
        strengths_count = sum(len(data.get("feedback", [])) for data in categorized_feedback.get("strengths", {}).values())
        areas_count = sum(len(data.get("feedback", [])) for data in categorized_feedback.get("areas_to_target", {}).values())
        advice_count = sum(len(data.get("feedback", [])) for data in categorized_feedback.get("advice", {}).values())
        
        stage3_time = time.time() - start_time
        print(f"[STAGE 3] Categorized feedback: {strengths_count} strengths, {areas_count} areas to target, {advice_count} advice items")
        print(f"[STAGE 3] Completed in {stage3_time:.2f} seconds")
        
        # Stage 4: Verify completeness - COMMENTED OUT FOR PERFORMANCE
        # print("\n[STAGE 4] Verifying extraction completeness...")
        # start_time = time.time()
        # verification = verify_extraction(categorized_feedback, feedback_transcript, client)
        # 
        # # If verification finds missing feedback, add it
        # if verification.get("missing_feedback"):
        #     print(f"[STAGE 4] Adding {len(verification['missing_feedback'])} missing feedback items")
        #     categorized_feedback = add_missing_feedback(categorized_feedback, verification["missing_feedback"])
        # stage4_time = time.time() - start_time
        # print(f"[STAGE 4] Completed in {stage4_time:.2f} seconds")
        
        # Format the final result
        print("\n[FINAL] Formatting results...")
        start_time = time.time()
        result = format_final_result(categorized_feedback)
        format_time = time.time() - start_time
        
        # Calculate total processing time
        total_time = stage1_time + stage2_time + stage3_time + format_time
        
        print("="*80)
        print(f"FEEDBACK EXTRACTION COMPLETE FOR FILE ID: {file_id}")
        print(f"Total processing time: {total_time:.2f} seconds")
        print(f"- Stage 1 (Identify stakeholders): {stage1_time:.2f}s ({stage1_time/total_time*100:.1f}%)")
        print(f"- Stage 2 (Extract feedback): {stage2_time:.2f}s ({stage2_time/total_time*100:.1f}%)")
        print(f"- Stage 3 (Categorize feedback): {stage3_time:.2f}s ({stage3_time/total_time*100:.1f}%)")
        print(f"- Final formatting: {format_time:.2f}s ({format_time/total_time*100:.1f}%)")
        print(f"Total feedback items: {strengths_count + areas_count + advice_count}")
        print(f"- Strengths: {strengths_count}")
        print(f"- Areas to target: {areas_count}")
        print(f"- Advice: {advice_count}")
        print("="*80)
        
        # Save to database
        feedback_data = {
            "task_id": db_task.id,
            "feedback": result
        }
        
        # Save to db
        db_feedback = create_feedback(FeedBackCreate(**feedback_data), db)
        return db_feedback.feedback
        
    # except Exception as e:
    #     print(f"Error in get_feedback: {str(e)}")
    #     raise HTTPException(status_code=500, detail=str(e))
