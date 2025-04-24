import json
import os

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
    try:
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

        # Load and format prompts
        strengths_prompt = load_prompt("feedback_strengths.txt")
        areas_prompt = load_prompt("feedback_areas.txt")

        # Initialize Claude client
        client = anthropic.Anthropic(api_key=env_variables.ANTHROPIC_API_KEY)

        # Get strengths analysis
        strengths_response = client.messages.create(
            model="claude-3-5-sonnet-latest",
            max_tokens=3000,
            temperature=0,
            messages=[
                {
                    "role": "user",
                    "content": strengths_prompt.format(feedback=feedback_transcript),
                }
            ],
        )

        # Get areas analysis
        areas_response = client.messages.create(
            model="claude-3-5-sonnet-latest",
            max_tokens=3000,
            temperature=0,
            messages=[
                {
                    "role": "user",
                    "content": areas_prompt.format(feedback=feedback_transcript),
                }
            ],
        )

        # Parse JSON responses
        try:
            strengths_text = strengths_response.content[0].text
            areas_text = areas_response.content[0].text

            # Extract JSON from strengths response
            try:
                strengths_data = json.loads(strengths_text)
            except json.JSONDecodeError:
                start = strengths_text.find("{")
                end = strengths_text.rfind("}") + 1
                if start >= 0 and end > 0:
                    strengths_data = json.loads(strengths_text[start:end])
                else:
                    raise ValueError("No JSON content found in strengths response")

            # Extract JSON from areas response
            try:
                areas_data = json.loads(areas_text)
            except json.JSONDecodeError:
                start = areas_text.find("{")
                end = areas_text.rfind("}") + 1
                if start >= 0 and end > 0:
                    areas_data = json.loads(areas_text[start:end])
                else:
                    raise ValueError("No JSON content found in areas response")

            # Combine results
            result = {
                "strengths": strengths_data.get("strengths", {}),
                "areas_to_target": areas_data.get("areas_to_target", {}),
            }


            feedback_data = {
                "task_id": db_task.id,
                "feedback": result
            }
            # Save to db
            db_feedback = create_feedback(FeedBackCreate(**feedback_data), db)
            return db_feedback.feedback
        except Exception as e:
            print(f"Error parsing responses: {str(e)}")
            print(f"Strengths response: {strengths_text}")
            print(f"Areas response: {areas_text}")
            raise HTTPException(
                status_code=500, detail="Failed to parse AI responses into valid JSON"
            )
    except Exception as e:
        print(f"Error in get_feedback: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
