from flask import Flask, render_template, request, jsonify
import os
from dotenv import load_dotenv
import openai

# Load environment variables from .env
load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")

app = Flask(__name__)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/generate", methods=["POST"])
def generate_tagline():
    data = request.get_json()
    responses = data.get("responses", "")
    city = data.get("city", "")
    zipcode = data.get("zipcode", "")

    # Updated prompt
    prompt = (
        f"You are a world-class real estate marketing expert. Write a high-impact, AI-enhanced tagline "
        f"for a property listing located in {city}, area code {zipcode}. "
        f"The realtor described the home with these details: {responses}. "
        f"Make the tagline elegant, compelling, and optimized to attract ideal buyers. "
        f"Use language that evokes emotion, luxury, or investment potential depending on the description."
    )

    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=100,
            temperature=0.9
        )

        ai_tagline = response.choices[0].message.content.strip()
        return jsonify({"tagline": ai_tagline})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
