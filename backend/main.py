from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
import os
# from routes.chat_routes import chat_router
from routes.outage_routes import outage_router
from routes.reddit_routes import reddit_router



# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:3000"],  
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],  # Only necessary methods
    allow_headers=[
        "Content-Type", 
        "Authorization", 
        "Accept", 
        "Origin", 
        "User-Agent",
        "X-Requested-With"
    ],  # Only necessary headers
)

# Initialize Supabase client (commented out for outage API)
# try:
#     supabase = get_supabase_client()
#     logger.info("✅ Supabase client initialized successfully")
# except Exception as e:
#     logger.error(f"❌ Failed to initialize Supabase client: {e}")
#     raise

# Include routes
# app.include_router(chat_router)
app.include_router(outage_router)
app.include_router(reddit_router)



# Basic health check
@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "FastAPI Admin API is running",
        "status": "healthy",
        "database": "Supabase",
        "version": "1.0.0",
    }

# Error handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Custom error handling"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.detail,
            "status_code": exc.status_code,
            "path": str(request.url.path)
        }
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
