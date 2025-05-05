import logging
import os
import re
import textwrap
from datetime import datetime
from typing import Dict, List

from anthropic import Anthropic
from PyPDF2 import PdfReader


class AssessmentProcessor:
    def __init__(self, api_key: str):
        """Initialize the processor with API key and set up logging."""
        self.client = Anthropic(api_key=api_key)
        self._setup_logging()
        
    def _setup_logging(self):
        """Set up logging configuration."""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler('assessment_processing.log'),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger(__name__)

    def extract_candidate_name(self, pdf_path: str) -> str:
        """Extract filename without extension to use as identifier."""
        filename = os.path.basename(pdf_path)
        return os.path.splitext(filename)[0]

    def read_pdf_in_chunks(self, pdf_path: str, chunk_size: int = 10, overlap: int = 2) -> List[str]:
        """Read PDF in chunks of specified pages with overlap between chunks."""
        chunks = []
        page_texts = []
        
        try:
            reader = PdfReader(pdf_path)
            total_pages = len(reader.pages)
            self.logger.info(f"Processing PDF with {total_pages} pages")
            
            # Extract text from all pages first
            for page_num, page in enumerate(reader.pages):
                page_texts.append(page.extract_text())
                self.logger.info(f"Extracted text from page {page_num + 1} of {total_pages}")
            
            # Create chunks with overlap
            for i in range(0, len(page_texts), chunk_size - overlap):
                # Ensure we don't go beyond the array bounds
                end_idx = min(i + chunk_size, len(page_texts))
                current_chunk = page_texts[i:end_idx]
                chunks.append("\n".join(current_chunk))
                self.logger.info(f"Created chunk {len(chunks)} with pages {i+1} to {end_idx}")
                
                # If this is the last chunk, break
                if end_idx == len(page_texts):
                    break
                    
            return chunks
        except Exception as e:
            self.logger.error(f"Error reading PDF {pdf_path}: {str(e)}")
            raise

    def create_filtering_prompt(self, document_name: str, chunk_text: str) -> str:
        """Create prompt for Claude to filter self-reflective content for a single candidate."""
        return f"""
        Process this assessment document chunk from '{document_name}'.
        
        Important Context:
        - This is a 360-degree assessment document for a single candidate
        - The document name '{document_name}' indicates this is an assessment for one individual
        - This document contains stakeholder interviews, feedback sessions, and potentially self-reflective comments from the candidate

        Task: Remove all self-reflective content from the assessed candidate while preserving all third-party feedback and assessments.

        Specifically identify and remove:
        - All parts where the candidate appears in first person ("I", "my", "we", "our")
        - Sections labeled as:
            * "Context Conversation"
            * "Self-reflection"
            * "Orientation call with [candidate]"
            * "Feedback session with [candidate]"
        - Any statements where the candidate:
            * Discusses their performance
            * Describes their relationships with others
            * Talks about their goals or motivations
            * Explains their management style
            * Reflects on their challenges
            * Shares their career aspirations
            * Provides their perspective on organizational changes
        - Direct quotes or paraphrased content from candidate interviews
        - The candidate's views on their own strengths and opportunities
        
        Carefully preserve:
        - All stakeholder interviews about the candidate
        - Feedback from supervisors, peers, and direct reports
        - HR documentation and assessment notes
        - External client/partner feedback
        - Interview questions and frameworks
        - Assessment criteria and ratings
        - Administrative details and schedules
        - Professional background information
        - Organizational context
        - Process documentation
        
        Maintain exact:
        - Document formatting
        - Page numbers
        - Section headers
        - Interview chronology
        - Assessment criteria frameworks
        
        Document chunk to process:
        
        {chunk_text}
        
        Return ONLY the filtered text with:
        1. All third-party assessments and feedback preserved
        2. All self-reflective content from the candidate removed
        3. Original structure and formatting maintained
        4. Section headers and page numbers intact
        
        IMPORTANT: Do not include any explanatory text, meta-commentary, or notes about what you've done. Do not use phrases like "I'll provide" or "Here's the processed version". Do not include explanatory notes in brackets like "[Self-reflective content removed]". Return only the actual filtered content.
        """

    def process_chunk(self, prompt: str) -> str:
        """Process chunk using Claude."""
        try:
            message = self.client.messages.create(
                model="claude-3-7-sonnet-latest",
                max_tokens=4096,
                system="You are an expert at filtering assessment documents while maintaining their structure and format. Return ONLY the filtered content without any explanatory text, meta-commentary, notes, or descriptions of what you're doing. Do not include phrases like 'I'll provide' or 'Here's the processed version' or explanatory notes in brackets.",
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            )
            return message.content[0].text.strip()
        except Exception as e:
            self.logger.error(f"Error processing chunk with Claude: {str(e)}")
            raise

    def create_executive_prompt(self, document_name: str, chunk_text: str) -> str:
        """Create prompt for Claude to extract executive's own interview content."""
        return f"""
        Process this assessment document chunk from '{document_name}'.
        
        Important Context:
        - This is a 360-degree assessment document where we need to extract only sections containing the executive's direct input and self-reflections
        - Pay special attention to discovery calls, context conversations, and orientation sessions
        
        Task: Extract ONLY the content showing the executive's direct voice and self-reflection.
        
        Specifically identify and preserve:
        - Discovery call and Context call sections
        - Career background discussions directly from the executive
        - The executive's own statements about:
            * Their role and responsibilities 
            * Career goals and aspirations
            * Personal motivators and passions
            * Self-identified strengths and opportunities
            * Views on organizational challenges
            * Leadership philosophy and approach
        - Content marked with interviewer observations in angle brackets (e.g., <talks in platitudes>)
        - Sections showing the executive's direct responses in conversations
        - Orientation and feedback sessions with the executive
        
        Remove:
        - Stakeholder interviews about the executive
        - Third-party observations without executive input
        - Administrative details
        - Interviewer notes that don't capture executive's voice
        
        Document chunk to process:
        {chunk_text}
        
        Return only the executive's direct input and self-reflective content, maintaining original formatting and structure.
        
        IMPORTANT: Do not include any explanatory text, meta-commentary, or notes about what you've done. Do not use phrases like "I'll provide" or "Here's the extracted content". Do not include explanatory notes in brackets. Return only the actual extracted content.
        """

    def process_chunk_executive(self, prompt: str) -> str:
        """Process chunk using Claude for executive content and clean the output."""
        try:
            message = self.client.messages.create(
                model="claude-3-7-sonnet-latest",
                max_tokens=4096,
                system="You are an expert at extracting executive's own words from assessment documents. Return ONLY the extracted content without any explanatory text, meta-commentary, or notes about what you've done. Do not use phrases like 'I'll provide' or 'Here's the extracted content'. Do not include explanatory notes in brackets. If no relevant content is found, return an empty string.",
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            )
            
            content = message.content[0].text.strip()
            
            # Remove common explanation patterns
            content = re.sub(r"I'm sorry, but.*?\n", "", content)
            content = re.sub(r"The document chunk.*?\n", "", content)
            content = re.sub(r"There is no.*?\n", "", content)
            content = re.sub(r"This section does not.*?\n", "", content)
            
            # Clean up any remaining explanation text that starts with common patterns
            lines = content.split('\n')
            cleaned_lines = []
            skip_line = False
            
            for line in lines:
                lower_line = line.lower().strip()
                if any(phrase in lower_line for phrase in [
                    "document chunk",
                    "no content",
                    "no relevant",
                    "i apologize",
                    "i'm sorry",
                    "could not find",
                    "does not contain",
                    "based on the criteria",
                    "please provide"
                ]):
                    skip_line = True
                    continue
                    
                if skip_line and line.strip() == "":
                    skip_line = False
                    continue
                    
                if not skip_line:
                    cleaned_lines.append(line)
            
            return "\n".join(cleaned_lines).strip()
            
        except Exception as e:
            self.logger.error(f"Error processing chunk with Claude: {str(e)}")
            raise

    def process_assessment_with_executive(self, pdf_path: str, SAVE_DIR: str) -> tuple[str, str]:
        """Process assessment document and extract both stakeholder feedback and executive interview."""
        try:
            document_name = self.extract_candidate_name(pdf_path)
            self.logger.info(f"Starting assessment processing for: {document_name}")
            
            # Use the improved chunking method with overlap
            chunks = self.read_pdf_in_chunks(pdf_path, chunk_size=10, overlap=2)
            stakeholder_chunks = []
            executive_chunks = []
            
            self.logger.info(f"Total chunks to process: {len(chunks)}")
            
            for i, chunk in enumerate(chunks, 1):
                self.logger.info(f"Processing chunk {i}/{len(chunks)}")
                
                # Process stakeholder feedback using original method
                stakeholder_prompt = self.create_filtering_prompt(document_name, chunk)
                stakeholder_chunk = self.process_chunk(stakeholder_prompt)
                stakeholder_chunks.append(stakeholder_chunk)
                
                # Process executive interview with clean output
                executive_prompt = self.create_executive_prompt(document_name, chunk)
                executive_chunk = self.process_chunk_executive(executive_prompt)
                if executive_chunk.strip():  # Only add non-empty chunks
                    executive_chunks.append(executive_chunk)
            
            # Combine processed chunks and remove any duplicate whitespace
            stakeholder_text = "\n\n".join(stakeholder_chunks)
            executive_text = "\n\n".join(filter(None, executive_chunks))  # Filter out empty chunks
            
            # Clean up final output
            executive_text = re.sub(r'\n{3,}', '\n\n', executive_text)  # Replace multiple newlines with double newline
            executive_text = executive_text.strip()
            
            # Create output directory if it doesn't exist
            output_dir = SAVE_DIR
            os.makedirs(output_dir, exist_ok=True)
            
            # Save outputs with timestamp
            # timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            stakeholder_path = os.path.join(
                output_dir, 
                f"filtered_{document_name}.txt"
            )
            executive_path = os.path.join(
                output_dir, 
                f"executive_{document_name}.txt"
            )
            
            # Only write executive file if there's actual content
            with open(stakeholder_path, 'w', encoding='utf-8') as f:
                f.write(stakeholder_text)
            
            if executive_text.strip():
                with open(executive_path, 'w', encoding='utf-8') as f:
                    f.write(executive_text)
                    self.logger.info(f"Executive interview saved to: {executive_path}")
            else:
                self.logger.info(f"No executive content found for: {document_name}")
            
            self.logger.info(f"Stakeholder feedback saved to: {stakeholder_path}")
            
            return stakeholder_text, executive_text
            
        except Exception as e:
            self.logger.error(f"Error processing assessment {pdf_path}: {str(e)}")
            raise

# Example usage:
if __name__ == "__main__":
    api_key = os.getenv("ANTHROPIC_API_KEY")
    processor = AssessmentProcessor(api_key)
    stakeholder_feedback, executive_interview = processor.process_assessment_with_executive("../../assessments/Carlyle - Ian Fujiyama - US Buyout Q360 2024.pdf")
