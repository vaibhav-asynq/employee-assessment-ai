import json
import os

import anthropic
from db.advice import AdviceCreate, create_advice, get_cached_advice
import env_variables
from auth.user import User, get_current_user
from db.core import get_db
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
@router.get("/api/db/get_advice/{file_id}")
async def get_advice(
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
            cached_data = get_cached_advice(user_id, file_id, db)
            if cached_data:
                print(f"Using cached advice for file ID {file_id}")
                return cached_data

        # If not cached or cache disabled, process normally
        db_task = get_task_by_user_and_fileId(user_id, file_id, db)
        # Get the feedback transcript
        feedback_path = os.path.join(SAVE_DIR, f"filtered_{file_id}.txt")
        if not os.path.exists(feedback_path):
            raise HTTPException(status_code=404, detail="Feedback transcript not found")

        with open(feedback_path, "r") as f:
            feedback_transcript = f.read()

        # Load and format prompt
        advice_prompt = load_prompt("advice.txt")
        prompt = advice_prompt.format(feedback=feedback_transcript)

        # Generate analysis using Claude
        client = anthropic.Anthropic(api_key=env_variables.ANTHROPIC_API_KEY)
        response = client.messages.create(
            model="claude-3-5-sonnet-latest",
            max_tokens=3000,
            temperature=0,
            messages=[{"role": "user", "content": prompt}],
        )

        # Parse JSON response
        response_text = response.content[0].text
        try:
            result = json.loads(response_text)
        except json.JSONDecodeError:
            try:
                # Find JSON-like content between curly braces
                start = response_text.find("{")
                end = response_text.rfind("}") + 1
                if start >= 0 and end > 0:
                    json_str = response_text[start:end]
                    result = json.loads(json_str)
                else:
                    raise ValueError("No JSON content found in response")
            except Exception as e:
                print(f"Error parsing response: {str(e)}")
                print(f"Raw response: {response_text}")
                raise HTTPException(
                    status_code=500,
                    detail="Failed to parse AI response into valid JSON",
                )

        advice_data = {
            "task_id": db_task.id,
            "advice": result
        }
        # Save to db
        db_advice = create_advice(AdviceCreate(**advice_data), db)
        return db_advice.feedback
    except Exception as e:
        print(f"Error in get_advice: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
