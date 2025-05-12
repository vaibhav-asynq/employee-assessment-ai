import json
import time
import asyncio
import re
import os
from uuid import uuid4
from datetime import datetime
from typing import Dict, List, Optional, Tuple, Any

from anthropic import Anthropic
from PyPDF2 import PdfReader

# Import the API config
try:
    from config.api_config import MAX_CONCURRENT_API_CALLS, MAX_API_CALLS_PER_MINUTE
except ImportError:
    # Default values if config file doesn't exist
    MAX_CONCURRENT_API_CALLS = 3
    MAX_API_CALLS_PER_MINUTE = 50

# API Call Manager for controlling concurrency
class ApiCallManager:
    """
    Manages concurrent API calls to ensure we don't exceed the maximum limit.
    Uses a semaphore to control concurrency.
    """
    def __init__(self, max_concurrent=MAX_CONCURRENT_API_CALLS):
        self.semaphore = asyncio.Semaphore(max_concurrent)
        self.active_calls = 0
        self.lock = asyncio.Lock()
        self.max_concurrent = max_concurrent
        
    async def __aenter__(self):
        """Acquire the semaphore before making an API call"""
        # Log if we're about to wait
        async with self.lock:
            current = self.active_calls
            if current >= self.max_concurrent:
                print(f"Waiting for API call slot (current: {current}/{self.max_concurrent})")
        
        # Acquire semaphore (will block if at max concurrent calls)
        await self.semaphore.acquire()
        
        async with self.lock:
            self.active_calls += 1
            current = self.active_calls
        
        print(f"API call started. Active calls: {current}/{self.max_concurrent}")
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Release the semaphore after the API call completes"""
        async with self.lock:
            self.active_calls -= 1
            current = self.active_calls
        self.semaphore.release()
        print(f"API call completed. Active calls: {current}/{self.max_concurrent}")

# Rate Limiter for controlling API call frequency
class RateLimiter:
    """
    Limits the rate of API calls to prevent hitting rate limits.
    Tracks calls over a rolling 60-second window.
    """
    def __init__(self, max_calls_per_minute=MAX_API_CALLS_PER_MINUTE):
        self.max_calls = max_calls_per_minute
        self.calls = []
        self.lock = asyncio.Lock()
        
    async def wait_if_needed(self):
        """Wait if we've exceeded our rate limit"""
        now = time.time()
        async with self.lock:
            # Remove calls older than 1 minute
            self.calls = [t for t in self.calls if now - t < 60]
            
            # If we're at the limit, wait
            if len(self.calls) >= self.max_calls:
                sleep_time = 60 - (now - self.calls[0])
                if sleep_time > 0:
                    print(f"Rate limit reached, waiting {sleep_time:.2f} seconds")
                    await asyncio.sleep(sleep_time)
            
            # Add this call
            self.calls.append(time.time())

# Create global instances
api_call_manager = ApiCallManager()
rate_limiter = RateLimiter()

def read_file_content(file_path: str) -> str:
    """Read and return content from a file."""
    try:
        with open(file_path, 'r') as file:
            return file.read()
    except Exception as e:
        print(f"Error reading file {file_path}: {str(e)}")
        return ""

def process_json(s):
    s = s.replace('```json\n', '').replace('\n```', '').replace('\n', '').replace("```","").replace("json","")
    start_index = s.find("{")
    end_index = s.rfind("}")
    inner_text = s[start_index:end_index+1]
    return inner_text

def parse_gpt_response(response_text: str) -> dict:
    try:
        escape_char_pattern = re.compile(r'\\.')
        cleaned_string = escape_char_pattern.sub('', response_text)
        # Clean up any formatting issues
        cleaned_string = ' '.join(cleaned_string.split())
        res = json.loads(process_json(cleaned_string))
        return res
    except Exception as e:
        print(f"Error parsing GPT response: {str(e)}")
        return {}

def get_reflection_prompts(executive_interview: str):
    # [Previous str1 remains the same]
    str1 = f"""Given the following executive's interview transcript and interview transcipts of others about the executive, identify:
1. Key stakeholders (direct supervisors and other senior leaders mentioned)
2. Current year

Executive's Interview:
{executive_interview}

Format the output as:
{{
    "stakeholders": ["name1", "name2"],
    "year": "YYYY"
}}
"""
    str2 = f"""Using ONLY this executive's interview section for the context summary:
Executive's Interview:
{executive_interview}

You 

Create a context paragraph that identifies:
   - Time in current role
   - Nature of sector/business
   - Current challenges/transitions
   - Strategic initiatives
   - Personal drivers/needs
   
You can use other data to determine factual information like Name of the executive, time, role etc. Context summary should be less than 80 words.
Always include this line at the end of context summary "Keep those needs in mind as you think through these suggestions for development."

Format the output as a SINGLE CONTINUOUS paragraph with proper spacing in:
{{
    "reflection_prompts": {{
        "discussion_prompt": "Prepare to have a discussion with [names] after you have had time for reflection and they receive this report. Make sure you think through:",
        "bullet_points": [
            "What did I hear from the feedback that was new or different than I expected?",
            "What resonated most for me? How does it connect to what I heard from other historical feedback I've received?",
            "What am I focused on in the immediate short term and for the rest of 2025?",
            "What kind of support do I need from [names], or others?"
        ],
        "context_summary": "A SINGLE PROPERLY FORMATTED PARAGRAPH: [Name], after [time] in the [role], you find yourself in [situation] while [challenge]. This appeals to your need for [drivers]. Keep those needs in mind as you think through these suggestions for development. "
    }}
}}
"""
    return [str1, str2]


def get_strengths_prompts():
    str2 = """Using the provided transcript of a candidate's feedback and evaluation, craft a comprehensive and detailed leadership report stating Strengths of the candidate with the following structure and guidelines:
**Strengths:**
- Identify and elaborate on the candidate's core strengths, organizing them under relevant subheadings that reflect their leadership qualities. Potential subheadings include, but are not limited to:
            - Selfless style
            - People and partnership skills
            - Depth of expertise
            - Drive for excellence
            - Building capability
            - Strategic leadership
            - Transparent communication
            - Supporting their team
            - Thoughtful depth
            - Business leadership
            - High standards
            - Supportive leader
            - Decisive courage
            - Creative expert
            - Strong relationships
            - Inspirational leadership
            - Big picture clarity and decisiveness
            - Continuing to evolve
            - Technical and business acumen
            - Exemplary work ethic
            - Technical excellence
            - Humanistic leadership
            - Innovating from strategy to delivery
            - Concise communication
            - Developing and running teams
            
Each strength should be structured as:
1. Opening statement demonstrating the strength (use adjectives for character qualities) in format ""[Name/Subject] is [character quality adjective]"
Example: Known as exceptionally astute Ian is analytically brilliant strategic leader. 
2. Supporting evidence with specific examples from feedback starting with "[Name/Subject] [action verb]..."
3. End with a single impact statement using varied transitions such as:
"As a result"  ,"Consequently" , "This leads to...", "This creates...", or any other simple variation of these words.

Connect final impact statement to:
- Business outcomes
- Team development
- Organizational effectiveness
- Client relationships
- Innovation and growth
- Market position
- Stakeholder value
Please note:
* Each subheading should have one paragraph following subject-predicate structure throughout
* Include relevant transcript quotes below each paragraph to justify your assessment
Example format:
"[Name/Subject] is [character quality adjective]". [Name/Subject] [specific example]. [Impact statement with transition]."
Given the transcript:"""

    str3 = """Now for each strength the description should be in 100 words. Structure each strength as:
1. Opening statement with character quality adjectives ("[Name/Subject] is [character quality adjective]")
2. Follow with "[Name/Subject] [specific examples with action verbs]"
3. End with a single impact statement using varied transition phrases"""

    str4 = """Now combine these into 3 non-overlapping subheadings in 1 paragraph each with no more than 100 words. For each:
1. Start with character quality adjectives ("[Name/Subject] is [character quality adjective]")
2. Use anonymous attribution phrases ("colleagues describe," "team members note," "peers recognize")
3. Include relevant quotes without identifying sources
5. Structure each paragraph as:
   - Opening with character quality adjectives
   - "[Subject] [specific examples with action verbs]"
   - Single impact statement at the end with transition phrase"""
    
    str5 = """Transform each write up with the following rules:

RULES: 1. First Sentence Structure: - Begin with "[Name] is [known as/described as/identified as]" - Follow with 3 key personality traits and professional identity - Example: "Ian is known as exceptionally astute, a brilliant strategic investor, and a talent developer" 2. Body Content Structure: - Convert descriptive statements into active verb-led sentences althought it should start with a pronoun. - Remove phrases like "colleagues describe," "team members note," or similar attributions - Focus on direct statements of capability and action 3. Impact Statement: - Consolidate multiple impact statements into a single, comprehensive statement - Place at the end of the paragraph - Combine quantitative and qualitative impacts if present - Use "As a result" ,"Consequently" , "This leads to...", "This creates...", or any other simple variation of these words to start the sentence. 4. Length Constraint: - Final output must be under 100 words
OUTPUT REQUIREMENTS: - Preserve all key information from the original text - Maintain professional tone and clarity - Ensure logical flow between sentences - Keep final output concise and impactful - Remove any redundancies or unnecessary attributions"""

    str6 = """Now can you jsonify this exact response as it is
                format should be 
                {
                "Strengths":{
                [
                {"paragraph_heading1":["content of the paragraph"]}
                ]
                }
                }
                dont provide any additional field apart from the one mentioned
            """
    return [str2, str3, str4, str5, str6]

def get_development_prompts():
    str2 = """
Review the provided interview transcripts and identify all statements related to potential development areas, concerns, or suggestions for improvement. For each relevant quote:
1. Note who made the comment (their role/relationship)
2. Extract the exact quote
3. Tag each quote with initial theme categories

Format the output as:
[Role/Relationship]
Quote: "[exact quote]"
Initial Theme: [theme]

Organize these by apparent themes, but don't finalize the categorization yet."""

    str3 = """Review the categorized feedback and:
1. Identify recurring patterns that appear across multiple sources
2. Group related themes together
3. For each potential pattern, note:
   - How many different sources mentioned it
   - What levels in the organization mentioned it (peers, reports, superiors)
   - Whether it appears in different contexts
   - The apparent impact on business/team/relationships

Present the top 5-6 potential development areas with this supporting data."""

    str_3_1 = """
Review the identified patterns and prioritize them based on:
1. Frequency of mention
2. Breadth of impact
3. Business criticality
4. Actionability/development potential

Select and justify the top 3 most critical development areas. For each area:
1. Provide a clear theme name
2. List key supporting evidence
3. Explain why this should be prioritized over others"""

    str_3_2 = """Based on the patterns identified, create 3 development areas. For each area:

1. Title Construction:
   Reference competencies:
   [Problem solving, Strategic thinking, Business acumen, Functional expertise, Innovation, Influence, Inspiring the team, Collaboration, Develops the team, Communication, Positive relationships, Inclusion, Org savvy, Planning, Execution, Driving results, Change and improvement, Integrity and trust, Adaptability, Learning agility, Courage]
   
   Create a professional 2-3 word title that:
   - Aligns with competency language style
   - Uses professional business terminology
   - Captures specific development focus
   
   Examples:
   - Instead of "Execution" → "Providing Direction"
   - Instead of "Communication" → "Directive Leadership"
   - Instead of "Develops the team" → "Team Advancement"

2. a. Opens with a positive statement about the person's related strength or natural tendency, followed immediately by the transition to development need in the same line: 
      - Begin with "[Name/Subject] is [adjectives describing current strengths]"
      - Follow with transition word and "[Name/Subject] [development need]"
      - Use natural transitions like "yet," "while," "though," "despite being," "although"
      Example: "[Name] is naturally collaborative and measured in approach, yet stakeholders observe that [Name] [specific action]..."
      
   b. Continue with specific observed behaviors:
      - Start with "[Name/Subject] [action verb]..."
      - Use phrases like "stakeholders observe that [Name/Subject] [specific action]"
      - Avoid characterizing the person - instead describe what they do or don't do
   
   c. Provide specific examples from feedback without attribution:
      - Begin with "[Name/Subject] [observable actions and behaviors]"
      - Include who is impacted (e.g., "junior team members," "direct reports")
      - Be specific about what is missing or needed

   d. Describe root causes ONLY if explicitly stated in feedback:
      - If executive stated a belief/preference: "Stakeholders have expressed that [Name/Subject] [specific observation]"
      - If organizational context creates the pattern: "The organizational structure..."
      - Avoid assumptions about personal preferences or beliefs

   e. State impact in a separate, dedicated sentence using simple transitions:
   - Use only these transition phrases:
     * "This results in..."
     * "Consequently..."
     * "This leads to..."
     * "As a result..."
     * "This creates..."
   
   - Clearly articulate business/team consequences
   - Be specific about what opportunities are missed or challenges created
   - Connect the impact to:
     * Business outcomes
     * Team effectiveness
     * Organizational capabilities
     * Market positioning
     * Talent development
     * Resource utilization
     * More strategic energy management
     * Scaling capability
     * Creating synergistic relationships
     * Tempering a bias to action
     * Investing in people and relationships
     * Expanding his communication

Example format:
"[Title]. [Name/Subject] is [positive strength adjectives], [transition word] stakeholders observe that [Name/Subject] [specific action/behavior]. [Name/Subject] [specific situation/example without attribution]. [Root cause only if explicitly stated in feedback]. [Impact statement using simple transition]."

Each write-up should be approximately 125-150 words."""

    str_3_3 = """Review the four development area write-ups and refine them to ensure:
1. Structure Verification:
   - Each title professionally aligns with competency themes without exact duplication
   - Every area begins with "[Name/Subject] is [positive character trait using adjectives]"
   - Transitions to development needs are tactful and varied
   - Development descriptions start with "[Name/Subject] [action verb]"
   - Examples are specific but not attributed to individuals
   - Impact is clearly articulated with simple transitions
2. Content Analysis:
   - Strength statements describe qualities using "[Name/Subject] is [adjectives]"
   - Development needs focus on observable behaviors starting with subject
   - Impact statements are clear and business-focused, using simple transitions
   - No prescriptive suggestions or next steps included
3. Language and Style:
   - Professional but accessible tone
   - Varied transition phrases beyond "however" for development needs
   - Each sentence starts with subject followed by predicate
   - Tone should be polite and constructive
   - Consistent length across all areas (125-150 words each)
4. Overall Flow:
   - Four distinct areas with minimal overlap
   - Logical progression between areas
   - Balanced coverage of interpersonal and business impacts
   - Clear connection between strengths and development needs
5. Quality Check:
   Verify each area against this template:
   - Opening: "[Name/Subject] is [strength adjectives], [transition] [Name/Subject] [development need]"
   - Development Need: "[Name/Subject] [action verbs]" to describe specific actions/behaviors
   - Evidence: "[Name/Subject] [concrete examples of behaviors]"
   - Root Cause: Only if explicitly stated
   - Impact: Separate sentence with simple transition phrase
   
Remove any:
- Action statements or recommendations
- Direct stakeholder attributions
- Assumed preferences or beliefs
- Character assessments or trait descriptions
- Subjective characterizations
- Redundant content across areas

Do not include anything else in the answer other than these areas to target points"""
    
    str_3_4 = """
    Review the four development area write-ups and refine them to ensure these points for each of the write ups:
1. Keep the first part of the opening sentence exactly as written, only modifying text after any transition word (yet, but, although etc.)
2. make sure you're using words like "though", "however", "but", or "yet" to signal the shift to a more negative statement in the middle of the sentence. Avoid using "while" in the middle.
3. Insert appropriate softeners ('sometimes,' 'tends to,' 'occasionally,' 'at times') ONLY where negative traits or actions are described
4. Preserve all positive statements and achievements exactly as written
5. Maintain the exact sentence structure and grammar of the original
6. Only modify descriptions that:
- Present absolute/categorical behaviors
- Imply persistent patterns
- Could be perceived as direct criticism
7. Make sure the impact is described in the last line and is only present in one line.
8. Do not add any new words or phrases unless absolutely necessary for the above requirements
9. Consistent length across each write up (125-150 words)

The goal is to maintain the original message while making only essential modifications to achieve a balanced, professional tone.
    
    """


                
#        - Root Cause: Only included if explicitly stated by executive or clearly tied to organizational context

    # str_3_3 = """
    #             now change the labguage of your report while maintaining the same structure with the guidlines as follows:
    #             guidlines: Use more direct, action-oriented language Focus more on immediate behavioral changes versus structural solutions Include more specific examples of situations requiring different behavior Better balance long-term strategic needs with immediate leadership moments
    #           """    

    str_4 = """Now can you jsonify this exact response as it is
                format should be 
                {
                "Areas to Target":{
                [
                {"paragraph_heading1":["content of the paragraph"]}
                ]
                }
                }
                dont provide any additional field apprart from the one mentioned"""
#     str4_next_steps_1 = """For each development area identified, create strategic action suggestions that:
# 1. Format Structure:
#    "To [development area theme]."
#    o [Strategic consideration]
#    o [Process/behavioral suggestion]
#    o [Optional: development resource or approach]
# 2. Content Guidelines:
#    - Begin each bullet with softer language:
#      * "Consider..."
#      * "Could explore..."
#      * "Might benefit from..."
#      * "Think through..."
   
#    - Suggest frameworks for thinking rather than precise actions
#    - Maintain strategic perspective appropriate for senior executives
#    - You can be specific, just do not quantify anything.
   
# 3. Ensure suggestions:
#    - Connect to core development themes
#    - Allow flexibility in implementation
#    - Respect executive's experience and judgment
#    - Build on existing strengths
# Example format:
# "To [theme]
# o Consider developing an approach to  [objective]
# o Could explore opportunities for [strategic change]
# o Think through ways to [leverage existing strength differently]"""
#     str4_next_steps_2 = """Review and refine the suggested approaches to ensure:
# 1. Tone:
#    - Appropriately consultative rather than directive
#    - Respects executive's seniority and experience
#    - Maintains strategic perspective
#    - Uses suggestive rather than prescriptive language
# 2. Content Level:
#    - Framework-focused rather than action-specific
#    - Allows for personal interpretation and adaptation
#    - Connects to broader organizational context
# 3. Structure:
#    - Clear thematic alignment with development areas
#    - Consistent use of suggestive language
#    - Balanced mix of approaches
#    - Progressive building of concepts
# 4. Value-Add:
#    - Offers fresh perspectives
#    - Suggests unexplored approaches
#    - Provides thinking frameworks
#    - Connects to executive's context
# Remove or revise any suggestions that:
# - Are too tactical
# - Sound overly directive
# - Lack strategic focus
# - Don't respect executive autonomy
# Final Check:
# - Is the tone consistently consultative?
# - Do recommendations allow for flexible implementation?
# - Is the language respectful of executive experience?
            
#             In the output only include the next steps. Do not add any other information.
            
#             """ 

#     str4_next_steps_3 = """now can you jsonify this exact response as it is
#                     format should be 
#                     {
#                     "Next Steps and Potential Actions":[
#                     {"paragraph_heading1":{"paragraph_content":["content of the paragraph"],"bullet_points":["bullet points if available"]}}
#                     ]
#                     }
#                     dont provide any additional field apart from the one mentioned"""

    str4_next_steps_1 = """Now for each paragraph, provide Next Steps and Potential Actions following these guidelines:

1. Heading Structure:
   - Begin each heading with "To" whenever possible
   - Use clear, simple language
   - Make the objective immediately clear
   Example: "To Enhance Team Development" rather than "For Strategic Team Enhancement"

2. Action Item Structure:
   - Start action items with direct but gentle verbs:
     * "Consider..."
     * "Explore..."
     * "Look into..."
     * "Try..."
     * "Examine..."
     * "Investigate..."
   - Avoid awkward phrases like:
     * "Could explore..."
     * "Might benefit from..."
     * "Could create..."
     * "Could establish..."

3. Content Requirements:
   - Address specific behaviors that need adjustment
   - Make accountability clear but non-confrontational
   - Suggest concrete actions
   - Maintain senior executive perspective
   - Include 4 bullet points per paragraph
   - Each bullet pointshould be between 20-25 words

4. Language Guidelines:
   - Use natural, flowing sentences
   - Maintain professional but accessible tone
   - Focus on opportunities rather than corrections
   - Be specific about scenarios and contexts

Example format:
"To [Clear Objective]
• Explore [specific action] by [detailed approach], focusing on [specific outcome]
• Consider [specific action] through [detailed method]
• Look into [specific action] where [context and purpose]"

Note: Do not include explicit impact sections or quantified metrics."""

    str4_next_steps_2 = """Now jsonify this exact response as it is
                    format should be 
                    {
                    "Next Steps and Potential Actions":[
                    {"paragraph_heading1":{"paragraph_content":["content of the paragraph"],"bullet_points":["bullet points if available"]}}
                    ]
                    }
                    dont provide any additional field apart from the one mentioned. Return paragraph_content as empty string if no information is there."""
 
    return [str2, str3,str_3_1, str_3_2, str_3_3, str_3_4, str_4, str4_next_steps_1, str4_next_steps_2]


async def call_claude_api(
    client: Anthropic,
    messages: List[Dict[str, Any]],
    system_prompt: str,
    model_name: str = "claude-3-5-sonnet-20241022",
    max_tokens: int = 4000,
    temperature: float = 0.0
) -> str:
    """
    Call Claude API with rate limiting and concurrency control.
    
    Args:
        client: Anthropic client
        messages: List of message objects
        system_prompt: System prompt
        model_name: Model name
        max_tokens: Maximum tokens
        temperature: Temperature
        
    Returns:
        Response text
    """
    # Apply rate limiting
    await rate_limiter.wait_if_needed()
    
    # Use API call manager to control concurrency
    async with api_call_manager:
        response = client.messages.create(
            model=model_name,
            max_tokens=max_tokens,
            temperature=temperature,
            messages=messages,
            system=system_prompt
        )
        return response.content[0].text

async def process_single_prompt(
    client: Anthropic,
    prompt_category: list,
    file_content: str,
    structured_system_prompt: str,
    temperature: float = 0.0,
    model_name: str = "claude-3-5-sonnet-20241022"
) -> Tuple[Dict[str, Any], Dict[str, Any]]:
    """
    Process a single prompt category with multiple prompts.
    
    Args:
        client: Anthropic client
        prompt_category: List of prompts
        file_content: Content to process
        structured_system_prompt: System prompt
        temperature: Temperature
        model_name: Model name
        
    Returns:
        Tuple of (parsed_response1, parsed_response2)
    """
    messages = []
    final_response1 = "{}"
    
    for i, prompt in enumerate(prompt_category):
        if i == 0:
            messages.append({
                "role": "user",
                "content": f"{prompt}\n\nContent:\n{file_content}"
            })
        else:
            messages.append({
                "role": "user",
                "content": prompt
            })
        
        response_text = await call_claude_api(
            client=client,
            messages=messages,
            system_prompt=structured_system_prompt,
            model_name=model_name,
            temperature=temperature
        )
        
        if len(prompt_category) > 5 and i == 6:
            final_response1 = response_text
            messages = messages[:-1]
            continue
            
        messages.append({
            "role": "assistant",
            "content": response_text
        })
        
    raw_result = messages[-1]["content"]
    return parse_gpt_response(final_response1), parse_gpt_response(raw_result)

async def process_prompts(feedback_content: str, executive_interview: str, api_key: str, system_prompt: str):
    """
    Process multiple prompt categories in parallel.
    
    Args:
        feedback_content: Content to process
        executive_interview: Executive interview content
        api_key: Anthropic API key
        system_prompt: System prompt
        
    Returns:
        List of results from processing all prompts
    """
    client = Anthropic(api_key=api_key)
    
    reflection_prompt = get_reflection_prompts(executive_interview)
    consumer_prompt = get_strengths_prompts()
    pain_points_prompt = get_development_prompts()
    
    print(f"Starting parallel processing of {len([reflection_prompt, consumer_prompt, pain_points_prompt])} prompt categories")
    start_time = time.time()
    
    # Process all prompt categories in parallel
    async def process_category(prompt_category):
        category_start = time.time()
        result, result1 = await process_single_prompt(
            client=client,
            prompt_category=prompt_category,
            file_content=feedback_content,
            structured_system_prompt=system_prompt
        )
        category_end = time.time()
        print(f"Processed category with {len(prompt_category)} prompts in {category_end - category_start:.2f} seconds")
        return result, result1
    
    # Use asyncio.gather to run all categories in parallel
    category_results = await asyncio.gather(
        process_category(reflection_prompt),
        process_category(consumer_prompt),
        process_category(pain_points_prompt)
    )
    
    # Flatten the results
    results = []
    for result_pair in category_results:
        results.append(result_pair[0])  # Add the first result
        results.append(result_pair[1])  # Add the second result
    
    end_time = time.time()
    print(f"Completed all prompt processing in {end_time - start_time:.2f} seconds")
    
    return results

def transform_content_to_report_format(content_list, employee_name, report_date):
    """
    Transform the provided content list into the format required for create_360_feedback_report
    
    Args:
        content_list: List of dictionaries containing the report content
        
    Returns:
        Dictionary formatted for create_360_feedback_report
    """
    report_data = {
        "name": employee_name,
        "date": report_date,
        "strengths": {},
        "areas_to_target": {},
        "next_steps": []
    }
    
    # Process each section
    for section in content_list:
        if not section:  # Skip empty dictionaries
            continue
            
        # Handle Strengths section
        if 'Strengths' in section:
            strengths_list = section['Strengths']
            for strength in strengths_list:
                for title, content_list in strength.items():
                    title2 = title[0].upper()+title[1:].lower()
                    title2 = title2.replace(".","")
                    title2 = title2 +"."
                    report_data['strengths'][title2] = content_list[0]

        
        # Handle Areas to Target section
        elif 'Areas to Target' in section:
            areas_list = section['Areas to Target']
            for area in areas_list:
                for title, content_list in area.items():
                    title2 = title[0].upper()+title[1:].lower()
                    title2 = title2.replace(".","")
                    title2 = title2 +"."
                    report_data['areas_to_target'][title2] = content_list[0]
        
        # Handle reflection prompts
        elif 'reflection_prompts' in section:
            prompts = section['reflection_prompts']
            # Add discussion prompt with sub-points
            report_data['next_steps'].append({
                'main': prompts['discussion_prompt'],
                'sub_points': prompts['bullet_points']
            })
            # Add context summary as a separate bullet point
            report_data['next_steps'].append(prompts['context_summary'])
        
        # Handle Next Steps section
        elif 'Next Steps and Potential Actions' in section:
            next_steps = section['Next Steps and Potential Actions']
            for step in next_steps:
                for title, content in step.items():
                    title2 = title[0].upper()+title[1:].lower()
                    title2 = title2.replace(".","")
                    title2 = title2 +"."
                    report_data['next_steps'].append({
                        'main': title2,
                        'sub_points': content['bullet_points']
                    })
    
    return report_data


async def extract_employee_info_async(pdf_path: str, api_key: str) -> Dict[str, Optional[str]]:
    """
    Extract employee name and full report date from E360 report using LLM (async version).
    
    Args:
        pdf_path (str): Path to the PDF file
        api_key (str): Anthropic API key
    
    Returns:
        Dict containing employee_name and report_date (full date if available)
    """
    try:
        # Initialize Anthropic client
        client = Anthropic(api_key=api_key)
        
        # Read the PDF
        reader = PdfReader(pdf_path)
        
        # Extract text from first 3 pages
        text = ""
        for i in range(min(3, len(reader.pages))):
            text += reader.pages[i].extract_text() + "\n\n"
        
        # Construct prompt for Claude
        prompt = f"""Please help me extract exactly two pieces of information from this E360 report text:
1. The full name of the employee for whom this report is prepared
2. The most complete date of the report you can find. This could be:
   - Full date (e.g., "July 24, 2024" or "7/24/2024")
   - Month and year (e.g., "July 2024")
   - Just year (e.g., "2024")

Return in exactly this format:
Name: [employee name]
Date: [most complete date found]

If you find multiple dates, prioritize dates that appear near the employee name or in the report header/title.

Here's the text:

{text[:4000]}  # Limiting text length for API

Only return the exact format specified above, nothing else."""
        
        # Get response from Claude using our rate limiting and concurrency control
        response_text = await call_claude_api(
            client=client,
            messages=[{"role": "user", "content": prompt}],
            system_prompt="You are a precise data extraction assistant. Only return the exact format requested, nothing else.",
            model_name="claude-3-opus-20240229",
            max_tokens=100,
            temperature=0
        )
        
        # Parse response
        # Extract name and date using simple parsing
        name = None
        date = None
        
        for line in response_text.split('\n'):
            if line.startswith('Name:'):
                name = line.replace('Name:', '').strip()
            elif line.startswith('Date:'):
                date = line.replace('Date:', '').strip()
        
        return {
            'employee_name': name,
            'report_date': date
        }
        
    except Exception as e:
        print(f"Error processing PDF: {str(e)}")
        return {
            'employee_name': None,
            'report_date': None
        }

def extract_employee_info(pdf_path: str, api_key: str) -> Dict[str, Optional[str]]:
    """
    Extract employee name and full report date from E360 report using LLM.
    This is a synchronous wrapper around the async version.
    
    Args:
        pdf_path (str): Path to the PDF file
        api_key (str): Anthropic API key
    
    Returns:
        Dict containing employee_name and report_date (full date if available)
    """
    try:
        # Use asyncio to run the async version
        import asyncio
        
        # Check if we're already in an event loop
        if asyncio.get_event_loop().is_running():
            # We're already in an async context, create a task
            print("Using existing event loop for employee info extraction")
            loop = asyncio.get_event_loop()
            return loop.run_until_complete(extract_employee_info_async(pdf_path, api_key))
        else:
            # We're not in an async context, use asyncio.run
            print("Creating new event loop for employee info extraction")
            return asyncio.run(extract_employee_info_async(pdf_path, api_key))
    except Exception as e:
        print(f"Error in extract_employee_info: {str(e)}")
        return {
            'employee_name': None,
            'report_date': None
        }

def format_date_for_display(date_str: str) -> str:
    """
    Helper function to format date string in a consistent way.
    Tries multiple common date formats.
    
    Args:
        date_str (str): Date string to format
        
    Returns:
        str: Formatted date string or original string if parsing fails
    """
    try:
        # Try different date formats
        formats = [
            '%B %d, %Y',  # July 24, 2024
            '%m/%d/%Y',   # 7/24/2024
            '%B %Y',      # July 2024
            '%m/%Y',      # 7/2024
            '%Y'          # 2024
        ]
        
        for fmt in formats:
            try:
                date_obj = datetime.strptime(date_str, fmt)
                # If it's just a year, return as is
                if fmt == '%Y':
                    return date_str
                # If month and year only
                if fmt in ['%B %Y', '%m/%Y']:
                    return date_obj.strftime('%B %Y')
                # Full date
                return date_obj.strftime('%B %d, %Y')
            except ValueError:
                continue
                
        return date_str  # Return original if no format matches
        
    except Exception as e:
        return date_str
