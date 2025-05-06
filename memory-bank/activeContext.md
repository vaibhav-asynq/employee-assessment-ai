# Active Context: Employee Assessment AI

## Current Work Focus
The project is focused on building an AI-powered employee assessment system that:
1. Extracts and analyzes feedback from various stakeholders
2. Identifies employee strengths and development areas
3. Provides actionable recommendations for professional growth
4. Enables saving and loading assessment snapshots

## Recent Changes
Based on the file structure and open tabs, recent work appears to be centered on:
1. PDF processing improvements using Aspose.Words instead of PyPDF2
2. Word-based PDF chunking (1500 words per chunk with 200 words overlap) instead of page-based chunking
3. Standalone PDF-to-text conversion utility (pdf_to_text.py)
4. Feedback extraction and processing pipeline
5. Competency generation from feedback data
6. Evidence sorting and categorization
7. Frontend components for displaying feedback and analysis
8. Snapshot functionality for saving/loading assessment states

## Next Steps
Potential next steps based on the current state:
1. Test and validate the improved PDF processing with Aspose.Words
2. Complete and refine the feedback extraction pipeline
3. Enhance the competency generation algorithms
4. Improve the evidence sorting and categorization
5. Develop comprehensive report generation
6. Expand snapshot functionality
7. Implement additional testing and validation

## Active Decisions and Considerations
Key decisions that appear to be guiding current development:
1. Using a modular approach with separate backend routers for different functionality
2. Implementing a staged processing pipeline for feedback analysis
3. Leveraging LLM capabilities for intelligent analysis and categorization
4. Using a component-based frontend architecture
5. Implementing snapshot functionality for state persistence

## Important Patterns and Preferences
Development patterns evident in the codebase:
1. **Backend**:
   - Modular router structure (feedback.py, file.py, snapshot.py)
   - Prompt-based LLM integration
   - Staged processing with intermediate outputs
   - Comprehensive testing with verification

2. **Frontend**:
   - Component-based architecture
   - Zustand for state management
   - Custom hooks for specific functionality
   - Separation of concerns between data fetching and presentation

## Learnings and Project Insights
Based on the project structure and files:
1. The feedback processing pipeline is complex and multi-staged
2. PDF processing benefits from using specialized libraries like Aspose.Words for better text extraction
3. Word-based chunking provides more consistent input sizes for LLM processing compared to page-based chunking
4. LLM integration requires careful prompt engineering and validation
5. State management is critical for handling complex assessment data
6. Snapshot functionality is important for tracking progress over time
7. The system needs to handle various document formats and extract structured data
8. Evidence sorting and categorization is a key differentiator for the platform
