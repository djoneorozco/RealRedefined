from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

app = FastAPI()

# Mount static files like avatar.png and real.mp4
app.mount("/static", StaticFiles(directory="static"), name="static")

# Use Jinja2 to serve HTML from templates
templates = Jinja2Templates(directory="templates")

# Serve the homepage
@app.get("/", response_class=HTMLResponse)
async def read_index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})
