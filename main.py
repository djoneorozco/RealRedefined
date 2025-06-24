from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles

app = FastAPI()

# Serve templates from /templates
templates = Jinja2Templates(directory="templates")

# Optional: serve static files like CSS, JS, images (create a folder named 'static' if needed)
app.mount("/static", StaticFiles(directory="static"), name="static")

# Route to serve the main avatar-enhanced HTML page
@app.get("/", response_class=HTMLResponse)
async def get_avatar_ui(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})
