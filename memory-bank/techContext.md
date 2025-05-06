# Technical Context: Employee Assessment AI

## Technology Stack

### Backend
- **Language**: Python
- **Framework**: FastAPI
- **Database**: PostgreSQL
- **ORM**: SQLAlchemy
- **Migration Tool**: Alembic
- **AI/ML**: LLM integration (likely OpenAI or similar)
- **PDF Processing**: Aspose.Words for Python
- **Testing**: Pytest
- **Authentication**: JWT-based (jwt_utils.py)

### Frontend
- **Framework**: Next.js (React)
- **Language**: TypeScript
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn UI
- **Authentication**: Clerk (ClerkAuthSync.ts)
- **HTTP Client**: Custom API client (api.ts)
- **Animation**: Lottie (for error states and loading)

### DevOps/Infrastructure
- **Version Control**: Git
- **Environment Variables**: .env files for configuration
- **API Documentation**: OpenAPI (via FastAPI)

## Development Setup

### Backend Requirements
- Python environment with dependencies from requirements.txt
- PostgreSQL database
- Environment variables configured in .env file
- LLM API access (likely OpenAI)

### Frontend Requirements
- Node.js environment
- Package manager (pnpm based on lock file)
- Environment variables configured in .env file

## Technical Constraints

### Performance Considerations
- PDF processing can be resource-intensive (mitigated by using Aspose.Words)
- Word-based chunking provides more consistent input sizes for LLM processing
- LLM API calls may have latency and rate limits
- State management for large assessment data sets

### Security Requirements
- Secure handling of employee assessment data
- Authentication and authorization for sensitive information
- Safe storage of API keys and credentials

### Scalability Factors
- Handling multiple concurrent users
- Processing and storing large numbers of assessments
- Managing LLM API usage and costs

## Dependencies

### External Services
- LLM API provider (OpenAI or similar)
- Clerk authentication service
- PostgreSQL database

### Internal Dependencies
- Backend services must be running for frontend functionality
- PDF processing pipeline for document analysis
- Prompt templates for LLM interactions

## Tool Usage Patterns

### Development Workflow
- Local development with separate frontend and backend servers
- Environment-specific configuration via .env files
- Testing with staged output verification

### Data Processing Pipeline
- Document upload → PDF extraction with Aspose.Words → Word-based chunking (1500 words/chunk)
- Feedback identification → Categorization → Analysis
- Competency generation → Evidence sorting → Report creation

### State Management
- Zustand store for global state
- Snapshot system for saving/loading assessment states
- Custom hooks for specific functionality (useSnapshotSaver, useSnapshotLoader)

### Testing Approach
- Backend testing with pytest
- Staged output verification for LLM-based processing
- JSON output for intermediate processing steps
