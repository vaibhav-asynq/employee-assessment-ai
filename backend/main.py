# main.py
from fastapi import FastAPI, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Union, List, Dict
import uuid
import os
from docx import Document
from docx.shared import Inches
import json
from process_pdf import AssessmentProcessor
from generate_report_llm import read_file_content, transform_content_to_report_format, process_prompts, extract_employee_info
from report_generation import create_360_feedback_report

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
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(SAVE_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

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

        feedback_content = read_file_content(others_transcript)
        executive_interview = read_file_content(self_transcript)

        system_prompt = ""

        results = await process_prompts(feedback_content,executive_interview, api_key, system_prompt)
        name_data = extract_employee_info(UPLOAD_DIR+"/"+file_id+".pdf", api_key)

        employee_name = name_data.get('employee_name',"")
        report_date = name_data.get('report_date',"")
        
        formatted_data = transform_content_to_report_format(results, employee_name, report_date)

        return formatted_data
        # create_360_feedback_report(header_txt+".pdf", formatted_data, header_txt)
        # Here you would typically process the PDF and extract information
        # This is a mock response for demonstration
        return {'name': 'Ian Fujiyama',
 'date': 'June 2024',
 'strengths': {'Strategic Leadership & Investment Excellence': "Ian is known as exceptionally astute, a brilliant strategic investor, and a decisive portfolio manager. He rapidly identifies critical investment factors, executes efficient decision-making on opportunities, and maintains disciplined portfolio oversight. He processes complex market dynamics swiftly, provides strategic guidance to portfolio companies, and drives value creation through targeted interventions. As a result, his portfolio consistently outperforms with 17% growth across companies while establishing his sector as Carlyle's premier vertical for investment excellence.",
  'People Development & Emotional Intelligence': 'Ian is recognized as a masterful talent developer, emotionally intelligent leader, and strategic mentor. He creates deliberate growth opportunities, maintains composed oversight during complex situations, and builds trust through transparent communication. He empowers team autonomy while providing strategic guidance, develops next-generation leaders, and navigates challenging situations with diplomatic finesse. Consequently, he has built an exceptional team of highly capable leaders who demonstrate superior client focus, technical expertise, and independent decision-making capabilities.',
  'Collaborative Leadership & Personal Growth': 'Ian is identified as a collaborative partner, continuous learner, and cross-functional leader. He actively engages in firm-wide initiatives, builds relationships across sectors, and consistently seeks opportunities for personal development. He implements feedback effectively, invests in skill enhancement, and promotes knowledge sharing across organizational boundaries. This creates a dual impact of strengthening both team performance and organizational effectiveness while establishing a culture of continuous improvement that extends beyond his immediate sphere of influence.'},
 'areas_to_target': {'STRATEGIC INFLUENCE': 'Ian is highly regarded for his intellectual depth and investment judgment, yet sometimes minimizes his visible leadership presence in key forums. He tends to defer speaking opportunities, occasionally steps back from industry platforms, and often maintains a supporting role in situations where his expertise could drive significant value. He typically approaches leadership moments with careful restraint, generally enabling others to represent initiatives he has shaped. This pattern appears more pronounced in larger group settings and external venues. As a result, the organization sometimes misses opportunities to leverage his market credibility, sector expertise remains less visible than peers, and team members have fewer chances to observe his strategic approach in action.',
  'DEVELOPMENTAL LEADERSHIP': 'Ian is skilled at identifying talent and creating empowering environments, though he tends to maintain a hands-off approach to development. He often structures autonomous learning experiences rather than engaging in direct coaching, particularly with developing talent. He typically maintains distance in day-to-day operations, allowing team members to navigate challenges independently without active guidance. The shift to hybrid work has reduced informal teaching moments. This leads to extended learning curves for junior staff, gaps in succession preparation, and increased pressure on team members to progress through self-directed experience.',
  'DIRECTIVE COMMUNICATION': 'Ian is thoughtful and measured in his interactions, while he sometimes emphasizes subtlety over clarity. He tends to guide discussions through indirect steering rather than explicit direction, occasionally crafts brief messages that belie deep analysis, and often maintains diplomatic positioning when direct intervention could accelerate outcomes. He typically approaches challenging conversations with careful consideration rather than immediate directness. This results in extended decision timelines, unclear expectations among stakeholders, and missed opportunities for others to learn from his strategic reasoning process.',
  'TEAM SUSTAINABILITY': "Ian is effective at driving high performance and results, although the current team structure shows signs of strain. He maintains exceptional output levels while managing through significant mid-level staffing gaps. He tends to continue previous workload expectations despite reduced team capacity and increased market pressures. The combination of high standards and resource constraints has sometimes created challenging patterns. This creates potential risks for retention, limits bandwidth for new opportunities, and may impact the team's ability to maintain their strong performance trajectory."},
 'next_steps': [{'main': 'Prepare to have a discussion with Brian, Steve and Sandra after you have had time for reflection and they receive this report. Make sure you think through:',
   'sub_points': ['What did I hear from the feedback that was new or different than I expected?',
    "What resonated most for me? How does it connect to what I heard from other historical feedback I've received?",
    'What am I focused on in the immediate short term and for the rest of 2024?',
    'What kind of support do I need from Brian, Steve and Sandra, or others?']},
  "Ian, after 3 years leading Carlyle's Aerospace, Defense & Government Services sector, you find yourself managing an 11-person team through significant transitions including RIFs, splitting time between DC/NYC offices, and no team offsite for the first time. While delivering strong performance (17% portfolio growth), you're focused on empowering your team and building the sector's external brand. This appeals to your need for developing others while maintaining work-life balance as a new empty nester. Keep those needs in mind as you think through these suggestions for development.",
  {'main': 'To Enhance Strategic Visibility',
   'sub_points': ['Consider identifying 2-3 key industry forums annually where sector expertise would add meaningful value to broader industry discussions',
    'Explore opportunities to showcase team achievements through structured internal presentations, focusing on strategic decision-making processes',
    'Look into creating informal mentoring moments by sharing investment thesis development with junior team members during deal analysis']},
  {'main': 'To Strengthen Team Development',
   'sub_points': ['Consider establishing regular strategy sessions where team members can directly observe and learn from your decision-making approach',
    'Explore implementing structured check-ins with developing talent, focusing on specific growth areas and career progression',
    'Look into creating more deliberate teaching moments during deal reviews, highlighting key considerations and strategic thinking']},
  {'main': 'To Increase Communication Impact',
   'sub_points': ['Consider adopting a more structured approach to feedback sessions, incorporating specific examples and clear direction',
    'Explore opportunities to share strategic insights more explicitly during team meetings, particularly around complex decision points',
    'Look into developing a more direct communication style for time-sensitive situations while maintaining diplomatic approach where appropriate']},
  {'main': 'To Build Sustainable Team Structure',
   'sub_points': ['Consider reviewing current workload distribution patterns to identify opportunities for more balanced resource allocation',
    'Explore implementing regular pulse checks with team members to better understand capacity constraints and development needs',
    'Look into creating structured development paths that allow for workload scaling while maintaining high performance standards']}]}
    except Exception as e:
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