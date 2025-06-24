import os
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
from dotenv import load_dotenv
import openai

# 1) Load .env (make sure your .env contains OPENAI_API_KEY=sk-…)
load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")
if not openai.api_key:
    raise RuntimeError("OPENAI_API_KEY not set in .env")

app = FastAPI()

# 2) Mount /static for avatar.png, real.mp4, etc.
app.mount("/static", StaticFiles(directory="static"), name="static")

# 3) Jinja2 templates in templates/
templates = Jinja2Templates(directory="templates")


# 4) Dummy favicon route (prevents browser 404s)
@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    # if you have one: return FileResponse("static/favicon.ico")
    return JSONResponse(status_code=204, content={})


# 5) Serve index.html
@app.get("/", response_class=HTMLResponse)
async def read_index(request: Request):
    """
    GET  / → renders your index.html with the avatar, video logic, and client‐side JS.
    """
    return templates.TemplateResponse("index.html", {"request": request})


# 6) Model for your client’s POST body
class GenerateRequest(BaseModel):
    responses: list[str]
    city: str
    zipcode: str


# 7) AI‐powered tagline generator
@app.post("/generate", response_class=JSONResponse)
async def generate_tagline(body: GenerateRequest):
    """
    POST /generate
      { responses: [...answers...], city: "Austin", zipcode: "78704" }
    returns
      { tagline: "..." }
    """
    # build a prompt from their answers
    prompt = (
        "You are a real‐estate marketing copywriter. "
        "Based on these bullet points:\n"
        f"{chr(10).join('- '+r for r in body.responses)}\n\n"
        f"Location: {body.city}, {body.zipcode}\n\n"
        "Write a single, attention‐grabbing tagline under 20 words "
        "designed to help sell this listing."
    )

    try:
        res = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role":"system","content":"You write concise, persuasive real‐estate taglines."},
                {"role":"user","content":prompt}
            ],
            max_tokens=60,
            temperature=0.7,
        )
        tagline = res.choices[0].message.content.strip()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"OpenAI error: {e}")

    return {"tagline": tagline}


# 8) If you deploy on Render, it will look for `uvicorn main:app`
#    In your Render dashboard set the start command to:
#       uvicorn main:app --host=0.0.0.0 --port=10000
#
# And in your requirements.txt include:
#   fastapi==0.111.0
#   uvicorn==0.29.0
#   python-dotenv==1.0.0
#   openai==1.3.7
#   jinja2==3.1.3
#   requests==2.31.0
