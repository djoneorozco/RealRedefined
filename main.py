import os
from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv
import openai

# Load environment variables from .env file
load_dotenv()

# Set OpenAI API key securely
openai.api_key = os.getenv("OPENAI_API_KEY")

# Initialize Flask app
app = Flask(__name__)

# Home route
@app.route('/')
def index():
    return render_template('index.html')

# API route to generate tagline
@app.route('/generate', methods=['POST'])
def generate():
    try:
        data = request.get_json()
        questions = data.get('questions', [])
        area_code = data.get('area_code', '00000')
        city = data.get('city', 'Unknown City')

        # Combine input for prompt
        prompt = (
            f"You're a real estate marketing expert AI. Based on the following listing details, "
            f"generate a short, emotionally engaging, high-converting tagline that would appeal to potential buyers in {city} ({area_code}):\n\n"
        )

        for idx, q in enumerate(questions, 1):
            prompt += f"{idx}. {q}\n"

        prompt += "\nTagline:"

        # Call OpenAI API
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a creative and persuasive real estate copywriter."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=60
        )

        # Extract and return the generated tagline
        tagline = response['choices'][0]['message']['content'].strip()
        return jsonify({"tagline": tagline})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Run the app
if __name__ == "__main__":
    app.run(debug=True)
