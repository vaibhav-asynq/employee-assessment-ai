# System Patterns: Employee Assessment AI

## Architecture Overview
The system follows a modern client-server architecture with:
- **Frontend**: Next.js React application (frontend_rac)
- **Backend**: FastAPI Python service (backend)
- **Data Flow**: PDF/document upload → feedback extraction → competency generation → report creation

## Key Technical Decisions

### Backend Architecture
- **FastAPI Framework**: Provides high-performance API endpoints with automatic OpenAPI documentation
- **Modular Router Structure**: Organized by domain (feedback.py, file.py, snapshot.py, advice.py)
- **Database Integration**: PostgreSQL with SQLAlchemy ORM and Alembic migrations
- **PDF Processing**: Aspose.Words for improved text extraction with word-based chunking
- **LLM Integration**: Structured prompting system for AI analysis with prompt templates
- **Caching System**: Implemented via cache_manager.py to optimize performance
- **Testing Framework**: Pytest-based testing with staged output for verification

### Frontend Architecture
- **Next.js Framework**: React-based with server-side rendering capabilities
- **Component Organization**: Structured by feature and responsibility
- **State Management**: Zustand for global state (interviewDataStore.ts)
- **API Integration**: Centralized API client (api.ts)
- **Custom Hooks**: For specific functionality (useSnapshotSaver.tsx, useSnapshotLoader.tsx)
- **UI Component Library**: Shadcn UI components with Tailwind CSS

## Component Relationships

### Backend Components
1. **Routers**: Handle HTTP requests and orchestrate business logic
   - file.py: Manages document uploads and processing
   - feedback.py: Handles feedback extraction and analysis
   - snapshot.py: Manages saving/loading assessment states
   - advice.py: Provides development recommendations

2. **Data Processing Pipeline**:
   - PDF processing with Aspose.Words (process_pdf.py)
   - Word-based chunking (1500 words per chunk with 200 words overlap)
   - Feedback extraction and categorization
   - Strength/development area identification
   - Evidence sorting and organization
   - Report generation

3. **Database Models**:
   - User management
   - File storage
   - Feedback data
   - Snapshots
   - Advice/recommendations

### Frontend Components
1. **Page Structure**:
   - Main application layout
   - Interview analysis interface
   - Upload and feedback screens
   - Report generation and viewing

2. **Core Components**:
   - Sidebar navigation and task history
   - Feedback display and management
   - Evidence organization and viewing
   - Competency generation and display
   - Snapshot management

3. **Data Flow**:
   - API requests → Zustand store → Component rendering
   - User interactions → State updates → API calls
   - Snapshot saving/loading → State persistence

## Critical Implementation Paths
1. **Document Processing Pipeline**:
   - Upload → PDF extraction with Aspose.Words → Word-based chunking → Text processing → Feedback identification
   
2. **Feedback Analysis Flow**:
   - Raw feedback → Stakeholder identification → Categorization → Strength/development area mapping
   
3. **Competency Generation**:
   - Categorized feedback → LLM analysis → Strength/development identification → Evidence sorting
   
4. **Snapshot System**:
   - State capture → Serialization → Storage → Retrieval → State restoration
