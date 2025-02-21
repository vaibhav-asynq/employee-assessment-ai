import traceback
from fastapi import FastAPI, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response
from pydantic import BaseModel
from typing import Union, List, Dict, Optional
import uuid
import os
import anthropic
from docx import Document
from docx.shared import Inches
import json
from process_pdf import AssessmentProcessor
from generate_report_llm import read_file_content, transform_content_to_report_format, process_prompts, extract_employee_info
from report_generation import create_360_feedback_report
from generate_raw_data import get_raw_data,get_strengths_data,get_areas_to_target_data
from csv_parser import parse_csv
from prompt_loader import (
    format_reflection_points_prompt,
    format_next_steps_prompt,
    format_area_content_prompt,
    format_strength_content_prompt,
    load_prompt
)

api_key = os.getenv("ANTHROPIC_API_KEY")
if not api_key:
    raise ValueError("ANTHROPIC_API_KEY environment variable is not set")
assessment_processor = AssessmentProcessor(api_key)

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition", "Content-Type"],
)

# Create uploads directory if it doesn't exist
UPLOAD_DIR = "../data/uploads"
SAVE_DIR = "../data/processed_assessments"
OUTPUT_DIR = "../data/output"
REPORT_DIR = "../data/generated_reports"
CSV_DIR = "../Data Inputs/Developmental Suggestions & Resources"
DUMMY_DATA_DIR = "./dummy_data"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(SAVE_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(REPORT_DIR, exist_ok=True)

# Data models
class NextStepPoint(BaseModel):
    main: str
    sub_points: List[str]

class InterviewAnalysis(BaseModel):
    name: str
    date: str
    strengths: Dict[str, str]
    areas_to_target: Dict[str, str]
    next_steps: List[Union[str, NextStepPoint]]

class GenerateContentRequest(BaseModel):
    heading: str
    file_id: str
    existing_content: Optional[str] = None

class GenerateNextStepsRequest(BaseModel):
    areas_to_target: Dict[str, str]
    file_id: str
    executive_transcript: Optional[str] = None

class SortEvidenceRequest(BaseModel):
    file_id: str
    headings: List[str]

# Store uploaded files and their analysis
files_store = {}

# Hardcoded test data
TEST_FILE_ID = "facc00fc-7288-4560-a400-fbbbbb3e63b5"
TEST_NAME = "Ian"

def load_dummy_data(filename: str) -> dict:
    """Load dummy data from a JSON file."""
    try:
        with open(os.path.join(DUMMY_DATA_DIR, filename), 'r') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading dummy data from {filename}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to load dummy data from {filename}"
        )

@app.options("/api/excel")
async def excel_options():
    headers = {
        "Access-Control-Allow-Origin": "http://localhost:3000",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Credentials": "true"
    }
    return Response(content="", headers=headers)

@app.get("/api/excel")
async def get_excel_file():
    file_path = "../Developmental Suggestions & Resources.xlsx"
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Excel file not found")
    
    with open(file_path, "rb") as f:
        content = f.read()
    
    headers = {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": "attachment; filename=Developmental Suggestions & Resources.xlsx",
        "Access-Control-Allow-Origin": "http://localhost:3000",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Credentials": "true"
    }
    
    return Response(content=content, headers=headers)

@app.post("/api/upload_file")
async def upload_file(file: UploadFile):
    try:
        # Generate unique file ID
        file_id = str(uuid.uuid4())
        # Save file to disk
        file_path = os.path.join(UPLOAD_DIR, f"{file_id}.pdf")
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        # Store file info
        files_store[file_id] = {
            "file_path": file_path,
            "original_name": file.filename
        }
        
        return {"file_id": TEST_FILE_ID}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/generate_report/{file_id}")
async def generate_report(file_id: str):
    try:
        # Load the report data from JSON file
        formatted_data = load_dummy_data('report_data.json')
        
        # Save the formatted data to a file
        report_file_path = os.path.join(REPORT_DIR, f"{file_id}_report.json")
        with open(report_file_path, 'w') as f:
            json.dump(formatted_data, f)
        
        return formatted_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/get_feedback")
async def get_feedback():
    return load_dummy_data('feedback_data.json')

@app.get("/api/get_raw_data/{file_id}")
async def get_raw_data_endpoint(file_id: str):
    try:
        return load_dummy_data('raw_data.json')
    except Exception as e:
        print(f"Error in get_raw_data_endpoint: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/get_strength_evidences")
async def get_strength_evidences():
    try:
        return load_dummy_data('strength_evidences.json')
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/get_development_areas")
async def get_development_areas():
    try:
        return load_dummy_data('development_areas.json')
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/dump_word")
async def generate_pdf_docuement(analysis: InterviewAnalysis):
    output_path = OUTPUT_DIR+"/temp.pdf" 
    header_txt = analysis.name + ' - Qualitative 360 Feedback'
    create_360_feedback_report(output_path, analysis, header_txt)
    return FileResponse(
            output_path,
            media_type="application/pdf",
            filename="interview_analysis.pdf"
        )

# Optional: Cleanup endpoint
@app.delete("/api/cleanup/{file_id}")
async def cleanup_file(file_id: str):
    if file_id in files_store:
        try:
            os.remove(files_store[file_id]["file_path"])
            del files_store[file_id]
            return {"message": "File cleaned up successfully"}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    raise HTTPException(status_code=404, detail="File not found")

async def generate_reflection_points(feedback_transcript: str, executive_transcript: str) -> dict:
    """Generate reflection points and context summary using both transcripts."""
    try:
        client = anthropic.Anthropic(api_key=api_key)
        prompt = format_reflection_points_prompt(feedback_transcript, executive_transcript)
        
        response = client.messages.create(
            model="claude-3-sonnet-20240229",
            max_tokens=1000,
            temperature=0,
            messages=[{"role": "user", "content": prompt}]
        )

        # Extract JSON from response
        response_text = response.content[0].text
        try:
            result = json.loads(response_text)
        except json.JSONDecodeError:
            try:
                start = response_text.find('{')
                end = response_text.rfind('}') + 1
                if start >= 0 and end > 0:
                    json_str = response_text[start:end]
                    result = json.loads(json_str)
                else:
                    raise ValueError("No JSON content found in response")
            except Exception as e:
                print(f"Error parsing reflection points response: {str(e)}")
                print(f"Raw response: {response_text}")
                raise HTTPException(
                    status_code=500,
                    detail="Failed to parse reflection points response"
                )
        
        return result
    except Exception as e:
        print(f"Error generating reflection points: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/generate_next_steps")
async def generate_next_steps(request: GenerateNextStepsRequest):
    try:
        print("\n=== Generate Next Steps Request ===")
        print(f"File ID: {request.file_id}")
        print(f"Areas to Target: {json.dumps(request.areas_to_target, indent=2)}")
        print(f"Number of areas: {len(request.areas_to_target)}")
        
        # Load both transcripts using file ID
        feedback_path = f"../data/processed_assessments/filtered_{request.file_id}.txt"
        executive_path = f"../data/processed_assessments/executive_{request.file_id}.txt"
        
        if not os.path.exists(feedback_path):
            raise HTTPException(status_code=404, detail=f"Feedback transcript not found at {feedback_path}")
        
        with open(feedback_path, 'r') as f:
            feedback_transcript = f.read()
            
        executive_transcript = ""
        if os.path.exists(executive_path):
            with open(executive_path, 'r') as f:
                executive_transcript = f.read()

        # Get reflection points first
        reflection_points = await generate_reflection_points(feedback_transcript, executive_transcript)
        print("\n=== Reflection Points ===")
        print(json.dumps(reflection_points, indent=2))
        
        # Format areas to target for action steps prompt
        areas_text = "\n".join([f"{title}: {content}" for title, content in request.areas_to_target.items()])
        print("\n=== Formatted Areas Text ===")
        print(areas_text)

        # Generate content using Claude
        client = anthropic.Anthropic(api_key=api_key)
        prompt = format_next_steps_prompt(TEST_NAME, areas_text, feedback_transcript)
        
        response = client.messages.create(
            model="claude-3-sonnet-20240229",
            max_tokens=2000,
            temperature=0,
            messages=[{"role": "user", "content": prompt}]
        )
        
        # Extract JSON from response
        response_text = response.content[0].text
        print("\n=== Claude Response ===")
        print(response_text)
        try:
            # Try to parse the entire response as JSON first
            result = json.loads(response_text)
        except json.JSONDecodeError:
            # If that fails, try to extract JSON from the text
            try:
                # Find JSON-like content between curly braces
                start = response_text.find('{')
                end = response_text.rfind('}') + 1
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
                    detail="Failed to parse AI response into valid JSON"
                )
        
        # Ensure the response has the expected structure
        if 'next_steps' not in result:
            result = {'next_steps': result}
            
        # Combine reflection points and action steps
        if 'reflection_prompts' in reflection_points:
            prompts = reflection_points['reflection_prompts']
            result['next_steps'] = [
                {
                    'main': prompts['discussion_prompt'],
                    'sub_points': prompts['bullet_points']
                },
                prompts['context_summary'],
                *result['next_steps']
            ]
        
        print("\n=== Final Result ===")
        print(json.dumps(result, indent=2))
        return result
    except Exception as e:
        print(f"Error in generate_next_steps: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/generate_area_content")
async def generate_area_content(request: GenerateContentRequest):
    try:
        print(f"[Area Content] Received request - heading: '{request.heading}', file_id: {request.file_id}, has_existing_content: {request.existing_content is not None}")
        
        # Load transcript using file ID
        feedback_path = f"../data/processed_assessments/filtered_{request.file_id}.txt"
        if not os.path.exists(feedback_path):
            raise HTTPException(status_code=404, detail=f"Feedback transcript not found at {feedback_path}")
        
        with open(feedback_path, 'r') as f:
            feedback_transcript = f.read()

        # Generate content using Claude
        client = anthropic.Anthropic(api_key=api_key)
        prompt = format_area_content_prompt(TEST_NAME, request.heading, feedback_transcript, request.existing_content)
        
        response = client.messages.create(
            model="claude-3-sonnet-20240229",
            max_tokens=1000,
            temperature=0,
            messages=[{"role": "user", "content": prompt}]
        )
        
        return {"content": response.content[0].text}
    except Exception as e:
        print(f"Error in generate_area_content: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/sort-strengths-evidence")
async def sort_strengths_evidence(request: SortEvidenceRequest):
    try:
        # Load transcript using file ID
        feedback_path = f"../data/processed_assessments/filtered_{request.file_id}.txt"
        if not os.path.exists(feedback_path):
            raise HTTPException(status_code=404, detail=f"Feedback transcript not found at {feedback_path}")
        
        with open(feedback_path, 'r') as f:
            transcript = f.read()

        # Initialize Claude client
        client = anthropic.Anthropic(api_key=api_key)
        
        # Load and format prompt
        sort_prompt = load_prompt("sort_evidence.txt")
        prompt = sort_prompt.format(
            transcript=transcript,
            headings="\n".join(request.headings)
        )
        
        # Get sorted evidence from Claude
        response = client.messages.create(
            model="claude-3-sonnet-20240229",
            max_tokens=2000,
            temperature=0,
            messages=[{"role": "user", "content": prompt}]
        )
        
        # Parse JSON response
        response_text = response.content[0].text
        try:
            result = json.loads(response_text)
        except json.JSONDecodeError:
            try:
                start = response_text.find('[')
                end = response_text.rfind(']') + 1
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
                    detail="Failed to parse AI response into valid JSON"
                )
        
        return result
    except Exception as e:
        print(f"Error in sort_strengths_evidence: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/sort-areas-evidence")
async def sort_areas_evidence(request: SortEvidenceRequest):
    try:
        # Load transcript using file ID
        feedback_path = f"../data/processed_assessments/filtered_{request.file_id}.txt"
        if not os.path.exists(feedback_path):
            raise HTTPException(status_code=404, detail=f"Feedback transcript not found at {feedback_path}")
        
        with open(feedback_path, 'r') as f:
            transcript = f.read()

        # Initialize Claude client
        client = anthropic.Anthropic(api_key=api_key)
        
        # Load and format prompt
        sort_prompt = load_prompt("sort_evidence.txt")
        prompt = sort_prompt.format(
            transcript=transcript,
            headings="\n".join(request.headings)
        )
        
        # Get sorted evidence from Claude
        response = client.messages.create(
            model="claude-3-sonnet-20240229",
            max_tokens=2000,
            temperature=0,
            messages=[{"role": "user", "content": prompt}]
        )
        
        # Parse JSON response
        response_text = response.content[0].text
        try:
            result = json.loads(response_text)
        except json.JSONDecodeError:
            try:
                start = response_text.find('[')
                end = response_text.rfind(']') + 1
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
                    detail="Failed to parse AI response into valid JSON"
                )
        
        return result
    except Exception as e:
        print(f"Error in sort_areas_evidence: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/generate_strength_content")
async def generate_strength_content(request: GenerateContentRequest):
    try:
        print(f"[Strength Content] Received request - heading: '{request.heading}', file_id: {request.file_id}, has_existing_content: {request.existing_content is not None}")
        
        # Load transcript using file ID
        feedback_path = f"../data/processed_assessments/filtered_{request.file_id}.txt"
        if not os.path.exists(feedback_path):
            raise HTTPException(status_code=404, detail=f"Feedback transcript not found at {feedback_path}")
        
        with open(feedback_path, 'r') as f:
            feedback_transcript = f.read()

        # Generate content using Claude
        client = anthropic.Anthropic(api_key=api_key)
        prompt = format_strength_content_prompt(TEST_NAME, request.heading, feedback_transcript, request.existing_content)
        
        response = client.messages.create(
            model="claude-3-sonnet-20240229",
            max_tokens=1000,
            temperature=0,
            messages=[{"role": "user", "content": prompt}]
        )
        
        return {"content": response.content[0].text}
    except Exception as e:
        print(f"Error in generate_strength_content: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/get_advice")
async def get_advice():
    try:
        with open("dummy_data/advices.json", "r") as f:
            advice_data = json.load(f)
        return advice_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
