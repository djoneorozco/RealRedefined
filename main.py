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
    responses = data.get("responses", [])
    city = data.get("city", "")
    zipcode = data.get("zipcode", "")

    prompt = f"""
You are a real estate marketing expert. Write a captivating, professional, and emotionally engaging tagline for a property listing based on the following answers from a realtor:

- Ideal buyer: {responses[0]}
- Surrounding area: {responses[1]}
- Vibe of the home: {responses[2]}
- Stand-out feature: {responses[3]}
- Lifestyle supported: {responses[4]}
- Interior highlights: {responses[5]}
- Exterior highlights: {responses[6]}
- Nearby attractions: {responses[7]}
- School quality or family-friendly factor: {responses[8]}
- What makes this home unforgettable: {responses[9]}

Location: {city}, ZIP code {zipcode}

Avoid clichés. Output just the tagline.
"""

    try:
        completion = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=60,
            temperature=0.7
        )
        tagline = completion.choices[0].message["content"].strip()
        return jsonify({"tagline": tagline})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=10000)
