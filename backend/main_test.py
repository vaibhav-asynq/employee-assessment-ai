# main.py
import traceback
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
        # stakeholder_feedback, executive_interview = assessment_processor.process_assessment_with_executive(file_path, SAVE_DIR)
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
        # feedback_content = read_file_content(others_transcript)
        # executive_interview = read_file_content(self_transcript)

        # system_prompt = ""

        # results = await process_prompts(feedback_content,executive_interview, api_key, system_prompt)
        # name_data = extract_employee_info(UPLOAD_DIR+"/"+file_id+".pdf", api_key)

        # employee_name = name_data.get('employee_name',"")
        # report_date = name_data.get('report_date',"")
        
        # formatted_data = transform_content_to_report_format(results, employee_name, report_date)


        # *****Uncomment******

        # create_360_feedback_report(header_txt+".pdf", formatted_data, header_txt)
        # Here you would typically process the PDF and extract information
        # This is a mock response for demonstration
        formatted_data=  {'name': 'Ian Fujiyama',
 'date': 'June 2024',
 'strengths': {'Strategic Leadership & Investment Excellence': 'Ian is known as exceptionally astute, a brilliant strategic investor, and a decisive dealmaker. He processes complex investment opportunities with 90% decision accuracy, while efficiently directing resources toward high-potential ventures. He eliminates underperforming opportunities swiftly and maintains rigorous investment discipline across his portfolio. He anticipates market movements and positions investments for optimal returns, demonstrated through his consistent above-market performance. As a result, his portfolio achieved 17% growth last year while establishing new benchmarks for investment excellence across the firm.',
  'People Development & Collaborative Leadership': 'Ian is recognized as an empowering mentor, cross-functional collaborator, and culture builder. He creates structured growth opportunities for team members while fostering autonomy and accountability. He builds bridges across sectors, promotes knowledge sharing, and develops next-generation leaders through hands-on guidance. He has successfully developed two vertical leaders who now independently drive significant business units. This leads to a high-performing, self-sufficient team culture that consistently delivers results while maintaining strong cross-organizational relationships.',
  'Stakeholder Management & Industry Expertise': 'Ian is identified as a composed negotiator, industry authority, and relationship architect in the A&D sector. He navigates complex stakeholder dynamics with remarkable emotional intelligence and strategic insight. He leverages deep market knowledge to guide portfolio companies through critical decisions and maintains strong relationships across the industry ecosystem. He consistently demonstrates mastery in high-stakes negotiations while preserving long-term partnerships. Consequently, he has established himself and Carlyle as the premier advisors in aerospace, defense, and government services sectors.'},
 'areas_to_target': {'STRATEGIC INFLUENCE': "Ian is highly respected for his investment expertise and analytical depth, yet tends to minimize his leadership visibility in broader forums. He sometimes steps back from industry speaking engagements, occasionally declines participation in external panels, and often maintains a lower profile in public settings. He tends to opt for private, focused interactions over larger platform opportunities, particularly regarding industry conferences and public events. This results in missed opportunities to leverage his expertise for market positioning, reduced external awareness of Carlyle's capabilities, and fewer chances for team members to observe and learn from his strategic approach in public settings.",
  'TALENT ACCELERATION': 'Ian is astute at identifying and evaluating talent, though his development approach sometimes remains selective rather than systematic. He tends to concentrate coaching efforts on senior direct reports while maintaining a more hands-off stance with junior team members during daily operations. He engages deeply in development conversations when specifically approached but occasionally hesitates to initiate teaching moments or provide unsolicited guidance. This leads to uneven skill development across the team, particularly at mid-levels, creating structural gaps in team capability and impacting succession readiness.',
  'DIRECTIVE LEADERSHIP': 'Ian is thoughtful and measured in his decision-making approach, yet his subtle guidance style can sometimes create ambiguity. He tends to guide teams through indirect suggestions rather than explicit direction, often sending brief email responses that belie his deep consideration of issues. He generally maintains a pattern of empowering team members by avoiding direct intervention in their work processes. This results in team members occasionally experiencing uncertainty about expectations and timelines, leading to decreased efficiency when more explicit guidance would accelerate progress.',
  'ORGANIZATIONAL PRESENCE': "Ian is skilled at building focused relationships and trust, yet his physical presence and informal engagement have sometimes become intermittent. He tends to divide his time between multiple office locations, which can limit spontaneous interactions and informal coaching opportunities. His split presence sometimes affects the frequency and consistency of team interactions across locations. This creates challenges for maintaining team cohesion, reduces opportunities for informal mentoring, and impacts the team's ability to maintain consistent communication patterns."},
 'next_steps': [{'main': 'Prepare to have a discussion with Brian, Steve, and Sandra after you have had time for reflection and they receive this report. Make sure you think through:',
   'sub_points': ['What did I hear from the feedback that was new or different than I expected?',
    "What resonated most for me? How does it connect to what I heard from other historical feedback I've received?",
    'What am I focused on in the immediate short term and for the rest of 2024?',
    'What kind of support do I need from Brian, Steve, and Sandra, or others?']},
  "Ian, after 3 years leading the Aerospace, Defense & Government Services sector at Carlyle, you find yourself managing a leaner 11-person team while splitting time between DC and NYC offices. Your sector delivered strong performance (17% growth) despite organizational changes and RIFs. You're focused on empowering your team, building the Carlyle brand in DC, and driving cross-sector collaboration, while wrestling with maintaining team cohesion and preventing burnout. This appeals to your need for building institutional credibility while developing others and making the organization better. Keep those needs in mind as you think through these suggestions for development.",
  {'main': 'To Increase Strategic Visibility',
   'sub_points': ["Consider accepting 2-3 targeted speaking engagements per quarter, focusing on areas where your investment expertise would most benefit Carlyle's market position.",
    "Explore opportunities to showcase team members alongside you at industry events, creating developmental moments while expanding Carlyle's presence.",
    "Look into establishing a regular cadence of thought leadership contributions through industry publications or Carlyle's platforms.",
    'Try scheduling structured time for external relationship building, particularly in areas aligned with current investment priorities.']},
  {'main': 'To Strengthen Team Development',
   'sub_points': ['Consider implementing regular strategy sessions where junior team members can observe and learn from your decision-making process.',
    'Explore creating informal mentoring moments during deal reviews by sharing specific insights about your analytical approach.',
    'Look into establishing weekly office hours or drop-in times when team members can seek guidance more readily.',
    'Try incorporating teaching moments into regular team meetings by sharing specific examples from past experiences.']},
  {'main': 'To Enhance Direct Communication',
   'sub_points': ['Consider prefacing indirect guidance with explicit statements of expectations or timelines to ensure clarity of direction.',
    'Explore expanding brief email responses with additional context when addressing complex or strategic matters.',
    'Look into establishing regular check-in points during projects where direct feedback and guidance can be provided.',
    'Try incorporating more specific deadlines and success metrics when delegating responsibilities to team members.']},
  {'main': 'To Increase Organizational Connection',
   'sub_points': ["Consider scheduling regular in-person team days when you're in each office location, focusing on relationship-building activities.",
    'Explore using video conferences for informal team connections beyond scheduled meetings when working remotely.',
    'Look into creating structured touchpoints with different team levels during your office visits.',
    'Try establishing consistent communication patterns that work across locations and time zones.']}]}
    
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
        # report_file_path = os.path.join(REPORT_DIR, f"{file_id}_report.json")
        # if not os.path.exists(report_file_path):
        #     raise HTTPException(status_code=404, detail="Report not found. Please generate the report first.")
        
        # with open(report_file_path, 'r') as f:
        #     report_data = json.load(f)
        
        # # Get the transcript
        # transcript_path = os.path.join(SAVE_DIR, f"filtered_{file_id}.txt")
        # if not os.path.exists(transcript_path):
        #     raise HTTPException(status_code=404, detail="Transcript not found.")
        
        # with open(transcript_path, 'r') as f:
        #     transcript = f.read()
        
        # # Extract strengths and areas_to_target from the report data
        # strengths = report_data.get('strengths', {})
        # areas_to_target = report_data.get('areas_to_target', {})
        
        # # Get raw data
        # # For strengths analysis
        # strengths_data = get_strengths_data(transcript, strengths, api_key)

        # # For areas to target analysis
        # areas_data = get_areas_to_target_data(transcript, areas_to_target, api_key)
        # # strengths_data= ""
        # # areas_data = "" 
        # # raw_data = {}
        # raw_data.update(strengths_data)
        # raw_data.update(areas_data)
        raw_data = {'strengths': {'Strategic Leadership & Investment Excellence': [{'name': 'Dayne Baird', 'role': 'Managing Director with U.S. Buyout, aerospace, defense and government services sectors (direct report)', 'quotes': ['The smartest person I know, really quickly gets things and processes information', '90% accurate, makes the right call', 'Solid at exiting, no conflicts there']}, {'name': 'Joe Logue', 'role': 'CEO Two Six Technologies', 'quotes': ['Brilliant', 'Knows the market exceptionally well, impressive how he understands it']}, {'name': 'Will Langenstein', 'role': 'Principal focused on U.S. Buyout & Growth (direct report)', 'quotes': ["Investing acumen: an incredible investor and a brilliant mind, what's a good deal and we should be investing in", 'Strategy and tactics on a deal, sees forest in spite of trees', 'Excellent negotiator']}], 'People Development & Collaborative Leadership': [{'name': 'Doug Brandely', 'role': 'MD for ADG (direct report)', 'quotes': ['Gives them space to develop, lets us have the stage', 'Good at spotting and evaluating talent']}, {'name': 'Anna Mire', 'role': 'VP (direct report)', 'quotes': ['Developing people, really works though the programs I needed to improve something I wanted to work on', 'Tone setter, keeping the group cohesive and united']}, {'name': 'Will Langenstein', 'role': 'Principal focused on U.S. Buyout & Growth (direct report)', 'quotes': ['Super thoughtful and strong as a leader in giving room to run, concerted effort to let others elevate themselves', 'Empowers and elevates them', 'He has a ton of experience and is excellent at spotting and growing talent', 'Good at coaching others']}], 'Stakeholder Management & Industry Expertise': [{'name': 'Martin Sumner', 'role': 'Sector Head Industrials (peer)', 'quotes': ['Developing deep relationships with people and management', 'He focuses heavily on negotiations and the 10 ways he can get screwed, very much a chess player and thinks through the landscape; shrewd negotiator']}, {'name': 'Joe Logue', 'role': 'CEO Two Six Technologies', 'quotes': ['Spends a lot of time building relationships', 'Really understands the market']}, {'name': 'Will Langenstein', 'role': 'Principal focused on U.S. Buyout & Growth (direct report)', 'quotes': ['Incredible on deal negotiations, one of his specialties is reading the room and figuring out how to approach things, understanding and predict responses']}]}, 'areas_to_target': {'STRATEGIC INFLUENCE': [{'name': 'Mark Marengo', 'role': 'JP Morgan, MD co-head of North America Diversified Industries Securities', 'quotes': ['Take advantage of the capacity he has freed up by building a talented team', "He can take on even more, broader opportunities at Carlyle (which he's doing)"]}, {'name': 'Martin Sumner', 'role': 'Sector Head Industrials (peer)', 'quotes': ["More confidence in communication (he's clear but shies away a bit from the spotlight and that takes away from his content)", 'Not the rah rah public figure']}, {'name': 'Joe Logue', 'role': 'CEO Two Six Technologies', 'quotes': ['He can push his brand more on the inside, politics not the results win the day', 'He seems to want to be asked to do instead of positioning himself to do it']}, {'name': 'Dayne Baird', 'role': 'Managing Director with U.S. Buyout, aerospace, defense and government services sectors (direct report)', 'quotes': ["Needs to get out there more and represent Carlyle, he just doesn't do it but need more external leadership", 'We need to do some brand building in aerospace, for example']}], 'TALENT ACCELERATION': [{'name': 'Doug Brandely', 'role': 'MD for ADG (direct report)', 'quotes': ['Less direct coaching and teaching, could be more involved and engaged in active coaching during the day to day work, teaching others how he thinks (especially more junior people)', 'Good at spotting and evaluating talent']}, {'name': 'Dayne Baird', 'role': 'Managing Director with U.S. Buyout, aerospace, defense and government services sectors (direct report)', 'quotes': ['Not sure he is mentoring anymore but he has the skill', 'One of my peers needs mentorship, new in defense vertical lead role', "We have a glaring hole in our team at the mid-level, due to departures (voluntary and involuntary) and we're all feeling it"]}, {'name': 'Wil Langenstein', 'role': 'Principal focused on U.S. Buyout & Growth (direct report)', 'quotes': ["He could facilitate and be more involved with others' development because he has a lot of resources, like an incredible network that can help us in our own careers", 'He has a ton of experience and is excellent at spotting and growing talent']}], 'DIRECTIVE LEADERSHIP': [{'name': 'Matt Savino', 'role': 'MD Head of U.S. Capital Markets (upward peer/partner)', 'quotes': ['Being more direct more frequently, not so polished and savvy all the time']}, {'name': 'Joe Logue', 'role': 'CEO Two Six Technologies', 'quotes': ['More proactive, always see him thinking and analyzing, gently guides those around him to the right answer, could save time with a more direct style']}, {'name': 'Wil Langenstein', 'role': 'Principal focused on U.S. Buyout & Growth (direct report)', 'quotes': ['Email communication: can look apathetic because he will send a quick, brief response even though he has read through and looked at things deeply (can send that message)', 'Communication in general around direction, deadlines and expectations (because he tries not to be overly involved)']}], 'ORGANIZATIONAL PRESENCE': [{'name': 'Anna Mire', 'role': 'VP (direct report)', 'quotes': ['People are in the office less nowadays, so I bump into him less (but I appreciate the flexibility), make himself more available when he is in the office']}, {'name': 'Dayne Baird', 'role': 'Managing Director with U.S. Buyout, aerospace, defense and government services sectors (direct report)', 'quotes': ["Recently an empty nester, but he needs to be deliberate about being present (more Zoom when he's in NY)"]}]}}
        
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