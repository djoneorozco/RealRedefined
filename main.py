# main.py
import os
from fastapi import FastAPI, Request, Response
from fastapi.responses import HTMLResponse, FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
import openai
from dotenv import load_dotenv

# 1) Load .env (make sure your .env contains OPENAI_API_KEY=sk-…)
load_dotenv()

openai.api_key = os.getenv("OPENAI_API_KEY", "")

app = FastAPI()

# 2) Mount /static for avatar.png, real.mp4, favicon.ico, etc.
app.mount("/static", StaticFiles(directory="static"), name="static")

# 3) Jinja2 templates in templates/
templates = Jinja2Templates(directory="templates")


# 4) Dummy favicon route (prevents browser 404s)
@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    # If you have a real favicon at static/favicon.ico, use:
    # return FileResponse("static/favicon.ico")
    return Response(status_code=204)


# 5) Serve index.html
@app.get("/", response_class=HTMLResponse)
async def read_index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


# 6) Schema for the tagline-generation payload
class GeneratePayload(BaseModel):
    responses: list[str]
    city: str
    zipcode: str


# 7) Your AI-powered endpoint
@app.post("/generate", response_class=JSONResponse)
async def generate_tagline(payload: GeneratePayload):
    """
    Expects JSON:
      {
        "responses": ["Family","Quiet Suburb",…],
        "city": "San Antonio",
        "zipcode": "78209"
      }
    Returns:
      { "tagline": "…AI‐crafted phrase…" }
    """
    # Example: call OpenAI to craft a tagline
    user_text = (
        "Create a catchy real‐estate tag line "
        f"for a home in {payload.city}, {payload.zipcode}. "
        "Use these details: " + ", ".join(payload.responses)
    )

    try:
        completion = await openai.ChatCompletion.acreate(
            model="gpt-3.5-turbo",
            messages=[{"role":"system","content":"You are a real‐estate marketing specialist."},
                      {"role":"user","content": user_text}],
            temperature=0.7,
            max_tokens=60,
        )
        tag = completion.choices[0].message.content.strip()
    except Exception as e:
        # On error, return a fallback
        tag = "Experience luxury living tailored just for you."

    return {"tagline": tag}
