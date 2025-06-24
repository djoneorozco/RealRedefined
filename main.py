from fastapi import FastAPI, Request, Form
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from dotenv import load_dotenv
import openai
import os

# Load environment variables
load_dotenv()

openai.api_key = os.getenv("OPENAI_API_KEY")

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

@app.get("/", response_class=HTMLResponse)
def read_root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.post("/generate_tagline")
async def generate_tagline(request: Request):
    data = await request.json()
    city = data.get("city")
    zip_code = data.get("zip")
    emotion = data.get("emotion")
    vibe = data.get("vibe")
    stand_out = data.get("standOut")

    prompt = (
        f"Craft a compelling real estate tagline for a home in {city}, {zip_code}. "
        f"The home gives off a {vibe} vibe and stands out for its {stand_out}. "
        f"It evokes a feeling of {emotion}. Make it catchy, appealing, and no more than one sentence."
    )

    try:
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a creative real estate copywriter."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7
        )
        ai_tagline = response.choices[0].message.content.strip()
        return JSONResponse(content={"tagline": ai_tagline})
    except Exception as e:
        return JSONResponse(content={"tagline": "There was an error generating the tagline."}, status_code=500)
