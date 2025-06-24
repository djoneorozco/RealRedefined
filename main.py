from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

app = FastAPI()

# ✅ Correct static folder mount — this line is critical
app.mount("/static", StaticFiles(directory="static"), name="static")

# ✅ Load HTML templates from 'templates' folder
templates = Jinja2Templates(directory="templates")

# ✅ Route to serve index.html with support for Jinja2 + static
@app.get("/", response_class=HTMLResponse)
async def read_index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})
