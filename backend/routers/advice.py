import json
import os

import anthropic
import env_variables
from auth.user import User, get_current_user
from db.advice import AdviceCreate, async_create_advice, async_get_cached_advice
from db.core import get_async_db
from db.file import async_get_task_by_user_and_fileId
from db.processed_assessment import async_get_processed_assessment_by_task_id
from dir_config import SAVE_DIR
from fastapi import APIRouter, HTTPException, Query, Request
from fastapi.params import Depends
from prompt_loader import load_prompt
from sqlalchemy.ext.asyncio import AsyncSession
from utils.loggers.advice_logger import advice_logger
from utils.loggers.endPoint_logger import logger as apiLogger

router = APIRouter(
    prefix="",
)


# here tasks will be created
@router.get("/api/get_advice/{file_id}")
async def get_advice(
    request: Request, 
    file_id: str,
    use_cache: bool = Query(
        True, description="Whether to use cached results if available"
    ),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
) :
    user_id = current_user.user_id
    apiLogger.info(f"User {user_id} requesting advice for file ID {file_id} (use_cache={use_cache})")
    try:
        # Check cache first
        if use_cache:
            cached_data = await async_get_cached_advice(user_id, file_id, db)
            if cached_data:
                apiLogger.info(f"Using cached advice for file ID {file_id}")
                advice_logger.info(f"Returned cached advice for user {user_id}, file ID {file_id}")
                return cached_data

        db_task = await async_get_task_by_user_and_fileId(user_id, file_id, db)
        apiLogger.info(f"Processing advice for task ID {db_task.id}")

        # try to get or generate transcripts
        feedback_transcript = None
        assess_data = await async_get_processed_assessment_by_task_id(db, db_task.id)
        if assess_data and assess_data.filtered_data:
            advice_logger.info(f"Using filtered data from processed assessment for task ID {db_task.id}")
            feedback_transcript = assess_data.filtered_data
        if not feedback_transcript:
            # Get the feedback transcript from file
            feedback_path = os.path.join(SAVE_DIR, f"filtered_{file_id}.txt")
            advice_logger.info(f"Attempting to read feedback transcript from file: {feedback_path}")
            if not os.path.exists(feedback_path):
                apiLogger.error(f"Feedback transcript not found for file ID {file_id}")
                raise HTTPException(status_code=404, detail="Feedback transcript not found or generated.")

            with open(feedback_path, "r") as f:
                feedback_transcript = f.read()
                advice_logger.info(f"Successfully read feedback transcript from file for file ID {file_id}")

        # Load and format prompt
        advice_prompt = load_prompt("advice.txt")
        prompt = advice_prompt.format(feedback=feedback_transcript)
        advice_logger.info(f"Prompt prepared for AI analysis for task ID {db_task.id}")

        # Generate analysis using Claude
        apiLogger.info(f"Sending request to Claude API for advice generation for task ID {db_task.id}")
        advice_logger.info(f"Using Claude model: claude-3-7-sonnet-latest with temperature=0")
        client = anthropic.Anthropic(api_key=env_variables.ANTHROPIC_API_KEY)
        response = client.messages.create(
            model="claude-3-7-sonnet-latest",
            max_tokens=3000,
            temperature=0,
            messages=[{"role": "user", "content": prompt}],
        )
        apiLogger.info(f"Received response from Claude API for task ID {db_task.id}")

        # Parse JSON response
        response_text = response.content[0].text
        advice_logger.info(f"Parsing JSON response for task ID {db_task.id}")
        try:
            result = json.loads(response_text)
            advice_logger.info(f"Successfully parsed JSON response for task ID {db_task.id}")
        except json.JSONDecodeError:
            advice_logger.warning(f"Initial JSON parsing failed for task ID {db_task.id}, attempting to extract JSON content")
            try:
                # Find JSON-like content between curly braces
                start = response_text.find("{")
                end = response_text.rfind("}") + 1
                if start >= 0 and end > 0:
                    json_str = response_text[start:end]
                    result = json.loads(json_str)
                    advice_logger.info(f"Successfully extracted and parsed JSON content for task ID {db_task.id}")
                else:
                    advice_logger.error(f"No JSON content found in response for task ID {db_task.id}")
                    raise ValueError("No JSON content found in response")
            except Exception as e:
                error_msg = f"Error parsing response: {str(e)}"
                advice_logger.error(f"{error_msg} for task ID {db_task.id}")
                advice_logger.debug(f"Raw response for task ID {db_task.id}: {response_text[:500]}...")
                apiLogger.error(f"Failed to parse AI response for task ID {db_task.id}: {str(e)}")
                raise HTTPException(
                    status_code=500,
                    detail="Failed to parse AI response into valid JSON",
                )

        advice_data = {
            "task_id": db_task.id,
            "advice": result
        }
        # Save to db
        apiLogger.info(f"Saving advice to database for task ID {db_task.id}")
        db_advice = await async_create_advice(AdviceCreate(**advice_data), db)
        advice_logger.info(f"Successfully saved advice to database for task ID {db_task.id}, advice ID: {db_advice.id}")
        apiLogger.info(f"Successfully generated and saved advice for file ID {file_id}, task ID {db_task.id}")
        return db_advice.advice
    except Exception as e:
        error_msg = f"Error in get_advice: {str(e)}"
        advice_logger.error(error_msg)
        apiLogger.error(f"Error generating advice for file ID {file_id}, user ID {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
