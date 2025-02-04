import os
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/csv/{file_type}")
async def read_csv(file_type: str):
    base_path = "../Data Inputs/Developmental Suggestions & Resources"
    
    file_mapping = {
        "suggestions": "Suggestions -Table 1.csv",
        "derailers": "Derailers-Table 1.csv",
        "key_themes": "KEY THEMES-Table 1.csv"
    }
    
    if file_type not in file_mapping:
        raise HTTPException(status_code=400, detail="Invalid file type")
        
    file_path = os.path.join(base_path, file_mapping[file_type])
    
    try:
        df = pd.read_csv(file_path)
        return df.to_dict(orient='records')
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
