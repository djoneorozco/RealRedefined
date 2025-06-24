# main.py
import os
from fastapi import FastAPI, Request, Response
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
import openai
from dotenv import load_dotenv

load_dotenv()                          # load local .env in dev
openai.api_key = os.getenv("OPENAI_API_KEY", "")

app = FastAPI()

# serve /static
app.mount("/static", StaticFiles(directory="static"), name="static")

# dummy favicon
@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    return Response(status_code=204)

# templates
templates = Jinja2Templates(directory="templates")

# Data model for POST
class GenerateRequest(BaseModel):
    responses: list[str]
    city: str
    zipcode: str

@app.get("/", response_class=HTMLResponse)
async def read_index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.post("/generate")
async def generate_tagline(req: GenerateRequest):
    try:
        prompt = (
            f"Create a catchy real estate tagline based on these details:\n"
            f"Answers: {req.responses}\n"
            f"City: {req.city}\n"
            f"Zip Code: {req.zipcode}\n\n"
            "Make it short, punchy, and professional."
        )
        resp = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[{"role":"user", "content": prompt}],
            temperature=0.7,
            max_tokens=40,
        )
        tagline = resp.choices[0].message.content.strip()
        return JSONResponse({"tagline": tagline})
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)
