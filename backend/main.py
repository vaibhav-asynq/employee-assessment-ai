# main.py
import traceback
from fastapi import FastAPI, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Union, List, Dict
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


api_key = os.getenv("ANTHROPIC_API_KEY")
assessment_processor = AssessmentProcessor(api_key)

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
class GenerateContentRequest(BaseModel):
    heading: str
    file_id: str

class NextStepPoint(BaseModel):
    main: str
    sub_points: List[str]

class InterviewAnalysis(BaseModel):
    name: str
    date: str
    strengths: Dict[str, str]
    areas_to_target: Dict[str, str]
    next_steps: List[Union[str, NextStepPoint]]

# Store uploaded files and their analysis
files_store = {}

@app.post("/api/upload_file")
async def upload_file(file: UploadFile):
    try:
        # Generate unique file ID
        file_id = str(uuid.uuid4())
        # Function call to save procseed files ands pdf
        # Save file to disk
        file_path = os.path.join(UPLOAD_DIR, f"{file_id}.pdf")
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        # *****Uncomment below line******
        stakeholder_feedback, executive_interview = assessment_processor.process_assessment_with_executive(file_path, SAVE_DIR)
        # Store file info
        files_store[file_id] = {
            "file_path": file_path,
            "original_name": file.filename
        }
        
        return {"file_id": file_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/generate_report/{file_id}")
async def generate_report(file_id: str):
    if file_id not in files_store:
        raise HTTPException(status_code=404, detail="File not found")
    # actuall call to llm after reading the pdf and txt
    try:
        self_transcript = SAVE_DIR+"/executive_"+file_id+".txt"
        others_transcript = SAVE_DIR+"/filtered_"+file_id+".txt"


        # *****Uncomment******
        feedback_content = read_file_content(others_transcript)
        executive_interview = read_file_content(self_transcript)

        system_prompt = ""

        results = await process_prompts(feedback_content,executive_interview, api_key, system_prompt)
        name_data = extract_employee_info(UPLOAD_DIR+"/"+file_id+".pdf", api_key)

        employee_name = name_data.get('employee_name',"")
        report_date = name_data.get('report_date',"")
        
        formatted_data = transform_content_to_report_format(results, employee_name, report_date)


        # *****Uncomment******

        # create_360_feedback_report(header_txt+".pdf", formatted_data, header_txt)
        # Here you would typically process the PDF and extract information
        # This is a mock response for demonstration
#         formatted_data=  {'name': 'Ian Fujiyama',
#  'date': 'June 2024',
#  'strengths': {'Strategic Leadership & Investment Excellence': 'Ian is known as exceptionally astute, a brilliant strategic investor, and a decisive dealmaker. He processes complex investment opportunities with 90% decision accuracy, while efficiently directing resources toward high-potential ventures. He eliminates underperforming opportunities swiftly and maintains rigorous investment discipline across his portfolio. He anticipates market movements and positions investments for optimal returns, demonstrated through his consistent above-market performance. As a result, his portfolio achieved 17% growth last year while establishing new benchmarks for investment excellence across the firm.',
#   'People Development & Collaborative Leadership': 'Ian is recognized as an empowering mentor, cross-functional collaborator, and culture builder. He creates structured growth opportunities for team members while fostering autonomy and accountability. He builds bridges across sectors, promotes knowledge sharing, and develops next-generation leaders through hands-on guidance. He has successfully developed two vertical leaders who now independently drive significant business units. This leads to a high-performing, self-sufficient team culture that consistently delivers results while maintaining strong cross-organizational relationships.',
#   'Stakeholder Management & Industry Expertise': 'Ian is identified as a composed negotiator, industry authority, and relationship architect in the A&D sector. He navigates complex stakeholder dynamics with remarkable emotional intelligence and strategic insight. He leverages deep market knowledge to guide portfolio companies through critical decisions and maintains strong relationships across the industry ecosystem. He consistently demonstrates mastery in high-stakes negotiations while preserving long-term partnerships. Consequently, he has established himself and Carlyle as the premier advisors in aerospace, defense, and government services sectors.'},
#  'areas_to_target': {'STRATEGIC INFLUENCE': "Ian is highly respected for his investment expertise and analytical depth, yet tends to minimize his leadership visibility in broader forums. He sometimes steps back from industry speaking engagements, occasionally declines participation in external panels, and often maintains a lower profile in public settings. He tends to opt for private, focused interactions over larger platform opportunities, particularly regarding industry conferences and public events. This results in missed opportunities to leverage his expertise for market positioning, reduced external awareness of Carlyle's capabilities, and fewer chances for team members to observe and learn from his strategic approach in public settings.",
#   'TALENT ACCELERATION': 'Ian is astute at identifying and evaluating talent, though his development approach sometimes remains selective rather than systematic. He tends to concentrate coaching efforts on senior direct reports while maintaining a more hands-off stance with junior team members during daily operations. He engages deeply in development conversations when specifically approached but occasionally hesitates to initiate teaching moments or provide unsolicited guidance. This leads to uneven skill development across the team, particularly at mid-levels, creating structural gaps in team capability and impacting succession readiness.',
#   'DIRECTIVE LEADERSHIP': 'Ian is thoughtful and measured in his decision-making approach, yet his subtle guidance style can sometimes create ambiguity. He tends to guide teams through indirect suggestions rather than explicit direction, often sending brief email responses that belie his deep consideration of issues. He generally maintains a pattern of empowering team members by avoiding direct intervention in their work processes. This results in team members occasionally experiencing uncertainty about expectations and timelines, leading to decreased efficiency when more explicit guidance would accelerate progress.',
#   'ORGANIZATIONAL PRESENCE': "Ian is skilled at building focused relationships and trust, yet his physical presence and informal engagement have sometimes become intermittent. He tends to divide his time between multiple office locations, which can limit spontaneous interactions and informal coaching opportunities. His split presence sometimes affects the frequency and consistency of team interactions across locations. This creates challenges for maintaining team cohesion, reduces opportunities for informal mentoring, and impacts the team's ability to maintain consistent communication patterns."},
#  'next_steps': [{'main': 'Prepare to have a discussion with Brian, Steve, and Sandra after you have had time for reflection and they receive this report. Make sure you think through:',
#    'sub_points': ['What did I hear from the feedback that was new or different than I expected?',
#     "What resonated most for me? How does it connect to what I heard from other historical feedback I've received?",
#     'What am I focused on in the immediate short term and for the rest of 2024?',
#     'What kind of support do I need from Brian, Steve, and Sandra, or others?']},
#     "Explore opportunities to showcase team members alongside you at industry events, creating developmental moments while expanding Carlyle's presence.",
#     "Look into establishing a regular cadence of thought leadership contributions through industry publications or Carlyle's platforms.",
#     'Try scheduling structured time for external relationship building, particularly in areas aligned with current investment priorities.']},
#   {'main': 'To Strengthen Team Development',
#    'sub_points': ['Consider implementing regular strategy sessions where junior team members can observe and learn from your decision-making process.',
#     'Explore creating informal mentoring moments during deal reviews by sharing specific insights about your analytical approach.',
#     'Look into establishing weekly office hours or drop-in times when team members can seek guidance more readily.',
#     'Try incorporating teaching moments into regular team meetings by sharing specific examples from past experiences.']},
#   {'main': 'To Enhance Direct Communication',
#    'sub_points': ['Consider prefacing indirect guidance with explicit statements of expectations or timelines to ensure clarity of direction.',
#     'Explore expanding brief email responses with additional context when addressing complex or strategic matters.',
#     'Look into establishing regular check-in points during projects where direct feedback and guidance can be provided.',
#     'Try incorporating more specific deadlines and success metrics when delegating responsibilities to team members.']},
#   {'main': 'To Increase Organizational Connection',
#    'sub_points': ["Consider scheduling regular in-person team days when you're in each office location, focusing on relationship-building activities.",
#     'Explore using video conferences for informal team connections beyond scheduled meetings when working remotely.',
#     'Look into creating structured touchpoints with different team levels during your office visits.',
#     'Try establishing consistent communication patterns that work across locations and time zones.']}]}
    
    # Save the formatted data to a file
        report_file_path = os.path.join(REPORT_DIR, f"{file_id}_report.json")
        with open(report_file_path, 'w') as f:
            json.dump(formatted_data, f)
        
        return formatted_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



@app.get("/api/get_raw_data/{file_id}")
async def get_raw_data_endpoint(file_id: str):
    try:
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
        # strengths_data= ""
        # areas_data = "" 
        raw_data = {}
        raw_data.update(strengths_data)
        raw_data.update(areas_data)
        # print(raw_data)
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
async def generate_pdf_docuement(analysis: InterviewAnalysis):
    output_path = OUTPUT_DIR+"/temp.pdf" 
    # header_txt = analysis + ' - Qualitative 360 Feedback June 2024'
    # print(analysis)
    # print(analysis.name)
    # print(analysis.date)
    \
    header_txt = analysis.name + ' - Qualitative 360 Feedback'
    create_360_feedback_report(output_path, analysis, header_txt)
    return FileResponse(
            output_path,
            media_type="application/pdf",
            filename="interview_analysis.pdf"
        )
    

# Optional: Cleanup endpoint
@app.post("/api/generate_strength_content")
async def generate_strength_content(request: GenerateContentRequest):
    try:
        # TODO: Implement strength content generation
        return {"content": "Test Strength"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/generate_area_content")
async def generate_area_content(request: GenerateContentRequest):
    try:
        # TODO: Implement area content generation
        return {"content": "Test Areas"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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
