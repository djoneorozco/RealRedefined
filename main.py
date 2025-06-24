from flask import Flask, render_template, request, jsonify
import openai
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Get your OpenAI API key from environment variable
openai.api_key = os.getenv("OPENAI_API_KEY")

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/generate-tagline', methods=['POST'])
def generate_tagline():
    data = request.get_json()
    responses = data.get("responses", [])
    area_code = data.get("area_code", "")
    city = data.get("city", "")

    prompt = f"""
    Based on the following real estate listing details, craft a professional and engaging tagline that would appear on a property flyer. Make it appealing to potential buyers, concise, emotionally engaging, and optimized for marketing.

    City: {city}
    Area Code: {area_code}
    Responses:
    """
    for i, answer in enumerate(responses, 1):
        prompt += f"\n{i}. {answer}"

    prompt += "\n\nTagline:"

    try:
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a seasoned real estate copywriter."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=50,
            temperature=0.7
        )
        tagline = response.choices[0].message['content'].strip()
        return jsonify({"tagline": tagline})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
