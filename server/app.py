import os
from openai import OpenAI
from flask import Flask, render_template, request, jsonify, Response, stream_with_context

# ── Client ──────────────────────────────────────────────────────────────────
client = OpenAI(
    base_url="https://api.ai.cc/v1",
    api_key=os.getenv("AICC_API_KEY", "sk-J6AIU7RYWX5PeCoGkn3ulRze2lwzKxLgk0R9l8NqtcBsNGKB"),
)

# ── Flask app ────────────────────────────────────────────────────────────────
app = Flask(__name__)

@app.route("/")
def index():
    return render_template("index.html")

# ── Chat (streaming) ─────────────────────────────────────────────────────────
@app.route("/chat", methods=["POST"])
def chat():
    messages = request.json.get("messages", [])

    # use gpt-4o for vision, gpt-4o-mini for text
    has_image = any(
        isinstance(m.get("content"), list) and
        any(p.get("type") == "image_url" for p in m["content"])
        for m in messages
    )
    model = "gpt-4o" if has_image else "gpt-4o-mini"

    def generate():
        stream = client.chat.completions.create(
            model=model,
            messages=messages,
            stream=True,
            temperature=0.5,
            max_tokens=800,
            top_p=0.9,
        )
        for chunk in stream:
            delta = chunk.choices[0].delta.content
            if delta:
                yield delta

    return Response(stream_with_context(generate()), mimetype="text/plain")

# ── Image generation ─────────────────────────────────────────────────────────
IMAGE_MODELS = ["gpt-image-1", "imagen-3.0-generate-002", "wan2.2-t2i-plus", "wan2.2-t2i-flash"]

@app.route("/image", methods=["POST"])
def image():
    prompt = request.json.get("prompt", "")
    for model_name in IMAGE_MODELS:
        try:
            response = client.images.generate(model=model_name, prompt=prompt, n=1)
            img = response.data[0]
            if hasattr(img, "url") and img.url:
                return jsonify({"url": img.url})
            elif hasattr(img, "b64_json") and img.b64_json:
                return jsonify({"b64": img.b64_json})
        except Exception as e:
            print(f"[Image] {model_name} failed: {e}")
    return jsonify({"error": "All image models failed"}), 500

# ── Test endpoints ────────────────────────────────────────────────────────────
@app.route("/test-image")
def test_image():
    results = {}
    for model_name in IMAGE_MODELS:
        try:
            response = client.images.generate(model=model_name, prompt="a red apple", n=1)
            img = response.data[0]
            results[model_name] = f"OK - url:{bool(img.url)} b64:{bool(img.b64_json)}"
        except Exception as e:
            results[model_name] = f"FAILED: {e}"
    return jsonify(results)

@app.route("/models")
def models():
    try:
        result = client.models.list()
        return jsonify([m.id for m in result.data])
    except Exception as e:
        return jsonify({"error": str(e)})

@app.route("/api/health")
def health():
    return jsonify({"status": "OK", "message": "Arc AI Python backend running"})

# ── CLI chatbot (run directly: python app.py cli) ────────────────────────────
def cli_chat():
    print("Arc AI Chatbot (type 'exit' to quit)\n")
    history = []
    while True:
        user_input = input("You: ").strip()
        if user_input.lower() in ("exit", "quit"):
            print("Bye!")
            break
        if not user_input:
            continue
        history.append({"role": "user", "content": user_input})
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=history,
            temperature=0.5,
            max_tokens=800,
        )
        reply = response.choices[0].message.content
        history.append({"role": "assistant", "content": reply})
        print(f"AI: {reply}\n")

# ── Entry point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "cli":
        cli_chat()
    else:
        app.run(debug=True, port=5001)
