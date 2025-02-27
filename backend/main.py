# main.py
import traceback
from fastapi import FastAPI, UploadFile, HTTPException, Depends, status, Response, Query
from io import BytesIO
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from typing import Union, List, Dict, Optional, Any
import anthropic
import uuid
import os
from docx import Document
from docx.shared import Inches
import json
from process_pdf import AssessmentProcessor
from generate_report_llm import read_file_content, transform_content_to_report_format, process_prompts, extract_employee_info
from report_generation import create_360_feedback_report
from generate_raw_data import get_raw_data,get_strengths_data,get_areas_to_target_data
import aspose.words as aw
from prompt_loader import (
    format_reflection_points_prompt,
    format_next_steps_prompt,
    format_area_content_prompt,
    format_strength_content_prompt,
    load_prompt
)
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from cache_manager import (
    get_cached_file_id,
    add_to_filename_map,
    get_cached_data,
    save_cached_data
)

# Initialize license object
license = aw.License()

# Set license
try:
    # Method 1: Load license from file
    license.set_license("Aspose.WordsforPythonvia.NET.lic")
    print("License set successfully!")
except Exception as e:
    print(f"Error setting license: {str(e)}")

api_key = os.getenv("ANTHROPIC_API_KEY")
if not api_key:
    raise ValueError("ANTHROPIC_API_KEY environment variable is not set")
assessment_processor = AssessmentProcessor(api_key)



# Authentication settings
SECRET_KEY = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"  # In production, use a secure random key
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/login")

# User model
class User(BaseModel):
    username: str
    hashed_password: str

# Token model
class Token(BaseModel):
    access_token: str
    token_type: str

# Token data model
class TokenData(BaseModel):
    username: Optional[str] = None

# User database (in-memory for simplicity)
# In a production environment, this would be a database
users_db = {
    "admin": {
        "username": "admin",
        "hashed_password": pwd_context.hash("admin")
    }
}

# Authentication functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_user(username: str):
    if username in users_db:
        user_dict = users_db[username]
        return User(**user_dict)
    return None

def authenticate_user(username: str, password: str):
    user = get_user(username)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
    user = get_user(username=token_data.username)
    if user is None:
        raise credentials_exception
    return user

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000","https://ff2c-34-202-149-23.ngrok-free.app/","http://34.202.149.23:3000/"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Authentication endpoints
@app.post("/api/login", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/users/me")
async def read_users_me(current_user: User = Depends(get_current_user)):
    return {"username": current_user.username}

# Create uploads directory if it doesn't exist
UPLOAD_DIR = "../data/uploads"
SAVE_DIR = "../data/processed_assessments"
OUTPUT_DIR = "../data/output"
REPORT_DIR = "../data/generated_reports"
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

def get_name_from_report(file_id: str) -> str:
    report_file_path = os.path.join(REPORT_DIR, f"{file_id}_report.json")
    if not os.path.exists(report_file_path):
        raise HTTPException(status_code=404, detail="Report not found. Please generate the report first.")
    
    with open(report_file_path, 'r') as f:
        report_data = json.load(f)
    return report_data.get('name', '')

# Store uploaded files and their analysis
files_store = {}

@app.post("/api/upload_file")
async def upload_file(
    file: UploadFile, 
    use_cache: bool = Query(True, description="Whether to use cached results if available"),
    current_user: User = Depends(get_current_user)
):
    try:
        # Check if we have this file cached
        if use_cache:
            cached_file_id = get_cached_file_id(file.filename, use_cache=True)
            if cached_file_id:
                print(f"Using cached file ID {cached_file_id} for {file.filename}")
                # Check if the file still exists
                file_path = os.path.join(UPLOAD_DIR, f"{cached_file_id}.pdf")
                if os.path.exists(file_path):
                    # Update files_store if needed
                    if cached_file_id not in files_store:
                        files_store[cached_file_id] = {
                            "file_path": file_path,
                            "original_name": file.filename
                        }
                    return {"file_id": cached_file_id}
        
        # If not cached or cache disabled, process normally
        file_id = str(uuid.uuid4())
        file_path = os.path.join(UPLOAD_DIR, f"{file_id}.pdf")
        
        # Save file to disk
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        # Process the file
        stakeholder_feedback, executive_interview = assessment_processor.process_assessment_with_executive(file_path, SAVE_DIR)
        
        # Store file info
        files_store[file_id] = {
            "file_path": file_path,
            "original_name": file.filename
        }
        
        # Add to cache mapping
        add_to_filename_map(file.filename, file_id)
        
        return {"file_id": file_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/generate_report/{file_id}")
async def generate_report(
    file_id: str, 
    use_cache: bool = Query(True, description="Whether to use cached results if available"),
    current_user: User = Depends(get_current_user)
):
    if file_id not in files_store:
        raise HTTPException(status_code=404, detail="File not found")
    
    try:
        # Check cache first
        if use_cache:
            cached_data = get_cached_data("reports", file_id)
            if cached_data:
                print(f"Using cached report for file ID {file_id}")
                return cached_data
        
        # If not cached or cache disabled, process normally
        self_transcript = SAVE_DIR+"/executive_"+file_id+".txt"
        others_transcript = SAVE_DIR+"/filtered_"+file_id+".txt"

        feedback_content = read_file_content(others_transcript)
        executive_interview = read_file_content(self_transcript)

        system_prompt = ""

        results = await process_prompts(feedback_content, executive_interview, api_key, system_prompt)
        name_data = extract_employee_info(UPLOAD_DIR+"/"+file_id+".pdf", api_key)

        employee_name = name_data.get('employee_name',"")
        report_date = name_data.get('report_date',"")
        
        formatted_data = transform_content_to_report_format(results, employee_name, report_date)

        # Save the formatted data to a file
        report_file_path = os.path.join(REPORT_DIR, f"{file_id}_report.json")
        with open(report_file_path, 'w') as f:
            json.dump(formatted_data, f)
        
        # Save to cache
        save_cached_data("reports", file_id, formatted_data)
        
        return formatted_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



@app.get("/api/get_raw_data/{file_id}")
async def get_raw_data_endpoint(
    file_id: str, 
    use_cache: bool = Query(True, description="Whether to use cached results if available"),
    current_user: User = Depends(get_current_user)
):
    try:
        # Check cache first
        if use_cache:
            cached_data = get_cached_data("raw_data", file_id)
            if cached_data:
                print(f"Using cached raw data for file ID {file_id}")
                return cached_data
        
        # If not cached or cache disabled, process normally
        # Load the generated report
        report_file_path = os.path.join(REPORT_DIR, f"{file_id}_report.json")
        if not os.path.exists(report_file_path):
            raise HTTPException(status_code=404, detail="Report not found. Please generate the report first.")
        
        with open(report_file_path, 'r') as f:
            report_data = json.load(f)
        
        # Get the transcript
        transcript_path = os.path.join(SAVE_DIR, f"filtered_{file_id}.txt")
        if not os.path.exists(transcript_path):
            raise HTTPException(status_code=404, detail="Transcript not found.")
        
        with open(transcript_path, 'r') as f:
            transcript = f.read()
        
        # Extract strengths and areas_to_target from the report data
        strengths = report_data.get('strengths', {})
        areas_to_target = report_data.get('areas_to_target', {})
        
        # Get raw data
        # For strengths analysis
        strengths_data = get_strengths_data(transcript, strengths, api_key)

        # For areas to target analysis
        areas_data = get_areas_to_target_data(transcript, areas_to_target, api_key)
        
        raw_data = {}
        raw_data.update(strengths_data)
        raw_data.update(areas_data)
        
        # Save to cache
        save_cached_data("raw_data", file_id, raw_data)
        
        return raw_data
        
    except Exception as e:
        print(f"Error in get_raw_data_endpoint: {str(e)}")
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


# @app.post("/api/dump_word")
# async def generate_word_document(analysis: InterviewAnalysis):
#     try:
#         # Create a new Word document
#         doc = Document()
        
#         # Add title
#         doc.add_heading('Interview Analysis Report', 0)
        
#         # Add basic info
#         doc.add_heading('Basic Information', level=1)
#         doc.add_paragraph(f'Name: {analysis.name}')
#         doc.add_paragraph(f'Date: {analysis.date}')
        
#         # Add strengths
#         doc.add_heading('Strengths', level=1)
#         for title, content in analysis.strengths.items():
#             doc.add_heading(title, level=2)
#             doc.add_paragraph(content)
        
#         # Add areas to target
#         doc.add_heading('Areas to Target', level=1)
#         for title, content in analysis.areas_to_target.items():
#             doc.add_heading(title, level=2)
#             doc.add_paragraph(content)
        
#         # Add next steps
#         doc.add_heading('Next Steps', level=1)
#         for step in analysis.next_steps:
#             if isinstance(step, str):
#                 doc.add_paragraph(step, style='List Bullet')
#             else:
#                 doc.add_paragraph(step.main)
#                 for sub_point in step.sub_points:
#                     p = doc.add_paragraph(style='List Bullet 2')
#                     p.add_run(sub_point)
        
#         # Save the document
#         output_path = os.path.join(UPLOAD_DIR, "interview_analysis.docx")
#         doc.save(output_path)
        
#         # Return the document as a response
#         return FileResponse(
#             output_path,
#             media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
#             filename="interview_analysis.docx"
#         )
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/dump_word")
async def generate_word_document(analysis: InterviewAnalysis, current_user: User = Depends(get_current_user)):
    try:
        # First generate PDF
        output_path = os.path.join(OUTPUT_DIR, "temp.pdf")
        header_txt = analysis.name + ' - Qualitative 360 Feedback'
        create_360_feedback_report(output_path, analysis, header_txt)

        # Convert PDF to DOCX
        docx_path = os.path.join(OUTPUT_DIR, "Output1.docx")
        doc = aw.Document(output_path)
        doc.save(docx_path)

        # Return the DOCX file
        return FileResponse(
            docx_path,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            filename="interview_analysis.docx"
        )
    except Exception as e:
        print(f"Error in generate_word_document: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    
@app.post("/api/dump_pdf")
async def generate_pdf_docuement(analysis: InterviewAnalysis, current_user: User = Depends(get_current_user)):
    output_path = OUTPUT_DIR+"/temp.pdf" 
    header_txt = analysis.name + ' - Qualitative 360 Feedback'
    create_360_feedback_report(output_path, analysis, header_txt)
    return FileResponse(
            output_path,
            media_type="application/pdf",
            filename="interview_analysis.pdf"
        )

@app.post("/api/upload_updated_report")
async def upload_updated_report(file: UploadFile, current_user: User = Depends(get_current_user)):
    try:
        # Validate file type
        if not file.filename.endswith('.docx'):
            raise HTTPException(
                status_code=400,
                detail="Only Word documents (.docx) are allowed"
            )
            
        # Read docx content
        content = await file.read()
        doc = Document(BytesIO(content))
        text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
        
        # Use Claude to parse the content
        client = anthropic.Anthropic(api_key=api_key)
        # Load and format prompt
        prompt = load_prompt("upload_updated_report.txt").format(text=text)

        response = client.messages.create(
            model="claude-3-5-sonnet-latest",
            max_tokens=4000,
            temperature=0,
            messages=[{"role": "user", "content": prompt}]
        )
        
        # Parse response with better error handling
        response_text = response.content[0].text
        try:
            # Try direct JSON parsing first
            parsed_data = json.loads(response_text)
        except json.JSONDecodeError:
            # Try to extract JSON if surrounded by other text
            try:
                start = response_text.find('{')
                end = response_text.rfind('}') + 1
                if start >= 0 and end > 0:
                    json_str = response_text[start:end]
                    parsed_data = json.loads(json_str)
                else:
                    raise ValueError("No JSON content found in response")
            except Exception as e:
                print(f"Error parsing response: {str(e)}")
                print(f"Raw response: {response_text}")
                raise HTTPException(
                    status_code=500,
                    detail="Failed to parse AI response into valid JSON"
                )
        
        return parsed_data
        
    except Exception as e:
        print(f"Error in upload_updated_report: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))




@app.delete("/api/cleanup/{file_id}")
async def cleanup_file(file_id: str, current_user: User = Depends(get_current_user)):
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
            model="claude-3-5-sonnet-latest",
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

@app.options("/api/generate_next_steps")
async def generate_next_steps_options():
    headers = {
        "Access-Control-Allow-Origin": "http://localhost:3000",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Credentials": "true"
    }
    return Response(content="", headers=headers)

@app.post("/api/generate_next_steps")
async def generate_next_steps(request: dict, current_user: User = Depends(get_current_user)):
    try:
        print("\n=== Generate Next Steps Request ===")
        file_id = request.get("file_id")
        areas_to_target = request.get("areas_to_target")
        if not file_id:
            raise HTTPException(status_code=400, detail="file_id is required")
        if not areas_to_target:
            raise HTTPException(status_code=400, detail="areas_to_target is required")
            
        print(f"File ID: {file_id}")
        print(f"Areas to Target: {json.dumps(areas_to_target, indent=2)}")
        print(f"Number of areas: {len(areas_to_target)}")
        
        # Load both transcripts using file ID
        feedback_path = f"../data/processed_assessments/filtered_{file_id}.txt"
        executive_path = f"../data/processed_assessments/executive_{file_id}.txt"
        
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
        areas_text = "\n".join([f"{title}: {content}" for title, content in areas_to_target.items()])
        print("\n=== Formatted Areas Text ===")
        print(areas_text)

        # Generate content using Claude
        client = anthropic.Anthropic(api_key=api_key)
        name = get_name_from_report(file_id)
        prompt = format_next_steps_prompt(name, areas_text, feedback_transcript)
        
        response = client.messages.create(
            model="claude-3-5-sonnet-latest",
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
async def generate_area_content(request: GenerateContentRequest, current_user: User = Depends(get_current_user)):
    try:
        print(f"[Area Content] Received request - heading: '{request.heading}', file_id: {request.file_id}, has_existing_content: {request.existing_content}")
        # print("Existing content: ",request.existing_content)
        # Load transcript using file ID
        feedback_path = f"../data/processed_assessments/filtered_{request.file_id}.txt"
        if not os.path.exists(feedback_path):
            raise HTTPException(status_code=404, detail=f"Feedback transcript not found at {feedback_path}")
        
        with open(feedback_path, 'r') as f:
            feedback_transcript = f.read()

        # Generate content using Claude
        client = anthropic.Anthropic(api_key=api_key)
        name = get_name_from_report(request.file_id)
        prompt = format_area_content_prompt(name, request.heading, feedback_transcript, request.existing_content)
        print(prompt)
        response = client.messages.create(
            model="claude-3-5-sonnet-latest",
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
async def sort_strengths_evidence(request: SortEvidenceRequest, current_user: User = Depends(get_current_user)):
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
        sort_prompt = load_prompt("sort_evidence_strenght.txt")
        prompt = sort_prompt.format(
            transcript=transcript,
            headings="\n".join(request.headings)
        )
        
        # Get sorted evidence from Claude
        response = client.messages.create(
            model="claude-3-5-sonnet-latest",
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

@app.get("/api/get_strength_evidences/{file_id}")
async def get_strength_evidences(
    file_id: str, 
    numCompetencies: int, 
    use_cache: bool = Query(True, description="Whether to use cached results if available"),
    current_user: User = Depends(get_current_user)
):
    try:
        # Check cache first with parameters
        if use_cache:
            cached_data = get_cached_data("strength_evidences", file_id, {"num_competencies": numCompetencies})
            if cached_data:
                print(f"Using cached strength evidences for file ID {file_id} with {numCompetencies} competencies")
                return cached_data
        
        # If not cached or cache disabled, process normally
        # Get the feedback transcript
        feedback_path = os.path.join(SAVE_DIR, f"filtered_{file_id}.txt")
        if not os.path.exists(feedback_path):
            raise HTTPException(status_code=404, detail="Feedback transcript not found")
        
        with open(feedback_path, 'r') as f:
            feedback_transcript = f.read()

        # Load and format prompt
        strength_prompt = load_prompt("strength_evidences_categorized.txt")
        prompt = strength_prompt.format(
            feedback=feedback_transcript,
            num_competencies=numCompetencies
        )
        
        # Generate analysis using Claude
        client = anthropic.Anthropic(api_key=api_key)
        response = client.messages.create(
            model="claude-3-5-sonnet-latest",
            max_tokens=3000,
            temperature=0,
            messages=[{"role": "user", "content": prompt}]
        )
        
        # Parse JSON response
        response_text = response.content[0].text
        try:
            result = json.loads(response_text)
        except json.JSONDecodeError:
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
        
        # Save to cache with parameters
        save_cached_data("strength_evidences", file_id, result, {"num_competencies": numCompetencies})
        
        return result
    except Exception as e:
        print(f"Error in get_strength_evidences: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/get_advice/{file_id}")
async def get_advice(
    file_id: str, 
    use_cache: bool = Query(True, description="Whether to use cached results if available"),
    current_user: User = Depends(get_current_user)
):
    try:
        # Check cache first
        if use_cache:
            cached_data = get_cached_data("advice", file_id)
            if cached_data:
                print(f"Using cached advice for file ID {file_id}")
                return cached_data
        
        # If not cached or cache disabled, process normally
        # Get the feedback transcript
        feedback_path = os.path.join(SAVE_DIR, f"filtered_{file_id}.txt")
        if not os.path.exists(feedback_path):
            raise HTTPException(status_code=404, detail="Feedback transcript not found")
        
        with open(feedback_path, 'r') as f:
            feedback_transcript = f.read()

        # Load and format prompt
        advice_prompt = load_prompt("advice.txt")
        prompt = advice_prompt.format(feedback=feedback_transcript)
        
        # Generate analysis using Claude
        client = anthropic.Anthropic(api_key=api_key)
        response = client.messages.create(
            model="claude-3-5-sonnet-latest",
            max_tokens=3000,
            temperature=0,
            messages=[{"role": "user", "content": prompt}]
        )
        
        # Parse JSON response
        response_text = response.content[0].text
        try:
            result = json.loads(response_text)
        except json.JSONDecodeError:
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
        
        # Save to cache
        save_cached_data("advice", file_id, result)
        
        return result
    except Exception as e:
        print(f"Error in get_advice: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/get_feedback/{file_id}")
async def get_feedback(
    file_id: str, 
    use_cache: bool = Query(True, description="Whether to use cached results if available"),
    current_user: User = Depends(get_current_user)
):
    try:
        # Check cache first
        if use_cache:
            cached_data = get_cached_data("feedback", file_id)
            if cached_data:
                print(f"Using cached feedback for file ID {file_id}")
                return cached_data
        
        # If not cached or cache disabled, process normally
        # Get the feedback transcript
        feedback_path = os.path.join(SAVE_DIR, f"filtered_{file_id}.txt")
        if not os.path.exists(feedback_path):
            print(feedback_path)
            raise HTTPException(status_code=404, detail="Feedback transcript not found")
        
        with open(feedback_path, 'r') as f:
            feedback_transcript = f.read()

        # Load and format prompts
        strengths_prompt = load_prompt("feedback_strengths.txt")
        areas_prompt = load_prompt("feedback_areas.txt")
        
        # Initialize Claude client
        client = anthropic.Anthropic(api_key=api_key)
        
        # Get strengths analysis
        strengths_response = client.messages.create(
            model="claude-3-5-sonnet-latest",
            max_tokens=3000,
            temperature=0,
            messages=[{"role": "user", "content": strengths_prompt.format(feedback=feedback_transcript)}]
        )
        
        # Get areas analysis
        areas_response = client.messages.create(
            model="claude-3-5-sonnet-latest",
            max_tokens=3000,
            temperature=0,
            messages=[{"role": "user", "content": areas_prompt.format(feedback=feedback_transcript)}]
        )
        
        # Parse JSON responses
        try:
            strengths_text = strengths_response.content[0].text
            areas_text = areas_response.content[0].text
            
            # Extract JSON from strengths response
            try:
                strengths_data = json.loads(strengths_text)
            except json.JSONDecodeError:
                start = strengths_text.find('{')
                end = strengths_text.rfind('}') + 1
                if start >= 0 and end > 0:
                    strengths_data = json.loads(strengths_text[start:end])
                else:
                    raise ValueError("No JSON content found in strengths response")
            
            # Extract JSON from areas response
            try:
                areas_data = json.loads(areas_text)
            except json.JSONDecodeError:
                start = areas_text.find('{')
                end = areas_text.rfind('}') + 1
                if start >= 0 and end > 0:
                    areas_data = json.loads(areas_text[start:end])
                else:
                    raise ValueError("No JSON content found in areas response")
            
            # Combine results
            result = {
                "strengths": strengths_data.get("strengths", {}),
                "areas_to_target": areas_data.get("areas_to_target", {})
            }
            
            # Save to cache
            save_cached_data("feedback", file_id, result)
            
            return result
            
        except Exception as e:
            print(f"Error parsing responses: {str(e)}")
            print(f"Strengths response: {strengths_text}")
            print(f"Areas response: {areas_text}")
            raise HTTPException(
                status_code=500,
                detail="Failed to parse AI responses into valid JSON"
            )
        
    except Exception as e:
        print(f"Error in get_feedback: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/get_development_areas/{file_id}")
async def get_development_areas(
    file_id: str, 
    numCompetencies: int, 
    use_cache: bool = Query(True, description="Whether to use cached results if available"),
    current_user: User = Depends(get_current_user)
):
    try:
        # Check cache first with parameters
        if use_cache:
            cached_data = get_cached_data("development_areas", file_id, {"num_competencies": numCompetencies})
            if cached_data:
                print(f"Using cached development areas for file ID {file_id} with {numCompetencies} competencies")
                return cached_data
        
        # If not cached or cache disabled, process normally
        # Get the feedback transcript
        feedback_path = os.path.join(SAVE_DIR, f"filtered_{file_id}.txt")
        if not os.path.exists(feedback_path):
            raise HTTPException(status_code=404, detail="Feedback transcript not found")
        
        with open(feedback_path, 'r') as f:
            feedback_transcript = f.read()

        # Load and format prompt
        development_prompt = load_prompt("development_areas_categorized.txt")
        prompt = development_prompt.format(
            feedback=feedback_transcript,
            num_competencies=numCompetencies
        )
        
        # Generate analysis using Claude
        client = anthropic.Anthropic(api_key=api_key)
        response = client.messages.create(
            model="claude-3-5-sonnet-latest",
            max_tokens=3000,
            temperature=0,
            messages=[{"role": "user", "content": prompt}]
        )
        
        # Parse JSON response
        response_text = response.content[0].text
        try:
            result = json.loads(response_text)
        except json.JSONDecodeError:
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
        
        # Save to cache with parameters
        save_cached_data("development_areas", file_id, result, {"num_competencies": numCompetencies})
        
        return result
    except Exception as e:
        print(f"Error in get_development_areas: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/sort-areas-evidence")
async def sort_areas_evidence(request: SortEvidenceRequest, current_user: User = Depends(get_current_user)):
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
        sort_prompt = load_prompt("sort_evidence_area_to_target.txt")
        prompt = sort_prompt.format(
            transcript=transcript,
            headings="\n".join(request.headings)
        )
        
        # Get sorted evidence from Claude
        response = client.messages.create(
            model="claude-3-5-sonnet-latest",
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
async def get_excel_file(current_user: User = Depends(get_current_user)):
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

@app.post("/api/generate_strength_content")
async def generate_strength_content(request: GenerateContentRequest, current_user: User = Depends(get_current_user)):
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
        name = get_name_from_report(request.file_id)
        prompt = format_strength_content_prompt(name, request.heading, feedback_transcript, request.existing_content)
        
        response = client.messages.create(
            model="claude-3-5-sonnet-latest",
            max_tokens=1000,
            temperature=0,
            messages=[{"role": "user", "content": prompt}]
        )
        
        return {"content": response.content[0].text}
    except Exception as e:
        print(f"Error in generate_strength_content: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))
