# main.py
import os

from fastapi import FastAPI, Request, Response
from fastapi.responses import HTMLResponse, JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
import openai

# 1️⃣ Load your OpenAI key from the env (set on Render under Environment → New Variable)
openai.api_key = os.getenv("OPENAI_API_KEY", "")

# 2️⃣ FastAPI + static mount
app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")

# 3️⃣ Jinja2 templates directory
templates = Jinja2Templates(directory="templates")

# 4️⃣ Favicon stub (avoids 404 noise)
@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    # if you add a real favicon at static/favicon.ico, uncomment:
    # return FileResponse("static/favicon.ico")
    return Response(status_code=204)

# 5️⃣ Serve the SPA shell
@app.get("/", response_class=HTMLResponse)
async def read_index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

# 6️⃣ Define the POST body for tagline generation
class TaglineRequest(BaseModel):
    responses: list[str]
    city: str
    zipcode: str

# 7️⃣ AI‐powered tagline endpoint
@app.post("/generate", response_class=JSONResponse)
async def generate_tagline(body: TaglineRequest):
    # Build a nice prompt from their answers
    details = "\n".join(f"- {ans}" for ans in body.responses)
    prompt = (
        "You are a creative marketing copywriter for real estate listings.\n"
        "Given these key details about a property, craft one bold, memorable tagline:\n"
        f"{details}\n\n"
        f"City: {body.city}\n"
        f"ZIP Code: {body.zipcode}\n\n"
        "Respond with **only** the tagline (no extra explanation)."
    )

    try:
        resp = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user",   "content": prompt}
            ],
            temperature=0.7,
            max_tokens=30,
        )
        tagline = resp.choices[0].message.content.strip()
        return {"tagline": tagline}

    except Exception as e:
        # Surface errors cleanly
        return JSONResponse({"error": str(e)}, status_code=500)
