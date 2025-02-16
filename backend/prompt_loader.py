import os

PROMPTS_DIR = os.path.join(os.path.dirname(__file__), 'prompts')

def load_prompt(filename: str) -> str:
    """Load a prompt from the prompts directory."""
    try:
        with open(os.path.join(PROMPTS_DIR, filename), 'r') as f:
            return f.read()
    except Exception as e:
        print(f"Error loading prompt from {filename}: {str(e)}")
        raise

def format_reflection_points_prompt(feedback_transcript: str, executive_transcript: str) -> str:
    """Format the reflection points prompt with the provided transcripts."""
    prompt = load_prompt('reflection_points.txt')
    return prompt.format(
        feedback_transcript=feedback_transcript,
        executive_transcript=executive_transcript
    )

def format_next_steps_prompt(name: str, areas_text: str, feedback_transcript: str) -> str:
    """Format the next steps prompt with the provided data."""
    prompt = load_prompt('next_steps.txt')
    return prompt.format(
        name=name,
        areas_text=areas_text,
        feedback_transcript=feedback_transcript
    )

def format_area_content_prompt(name: str, heading: str, feedback_transcript: str) -> str:
    """Format the area content prompt with the provided data."""
    prompt = load_prompt('area_content.txt')
    return prompt.format(
        name=name,
        heading=heading,
        feedback_transcript=feedback_transcript
    )

def format_strength_content_prompt(name: str, heading: str, feedback_transcript: str) -> str:
    """Format the strength content prompt with the provided data."""
    prompt = load_prompt('strength_content.txt')
    return prompt.format(
        name=name,
        heading=heading,
        feedback_transcript=feedback_transcript
    )
