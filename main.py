from fastapi import FastAPI, Request, Form
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from dotenv import load_dotenv
import os
import openai

# Load environment variables
load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")

# Initialize app
app = FastAPI()

# Mount static folder
app.mount("/static", StaticFiles(directory="static"), name="static")

# Set up templates folder
templates = Jinja2Templates(directory="templates")

# Home route (renders index.html)
@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

# AI Tagline generation route
@app.post("/generate")
async def generate_tagline(
    request: Request,
    responses: str = Form(...),
    city: str = Form(...),
    zipcode: str = Form(...),
    vibe: str = Form(...),
    standOut: str = Form(...),
    emotion: str = Form(...)
):
    try:
        prompt = (
            f"Create a real estate listing tagline using these traits: vibe='{vibe}', "
            f"standOut='{standOut}', emotion='{emotion}', location='{city}, {zipcode}'. "
            f"Target audience response: '{responses}'. The tagline should be one sentence, stylish, and enticing."
        )

        completion = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a creative real estate copywriter."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=60,
            temperature=0.8
        )

        ai_tagline = completion.choices[0].message['content'].strip()
        return JSONResponse({"tagline": ai_tagline})

    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)

# For local dev testing (not needed in Render, but fine locally)
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=10000, reload=True)
