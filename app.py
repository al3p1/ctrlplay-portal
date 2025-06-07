from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from datetime import datetime
import requests
from supabase_config import SUPABASE_URL, HEADERS
import os

app = Flask(__name__)
CORS(app)

def supabase_get(table):
    res = requests.get(f"{SUPABASE_URL}/rest/v1/{table}?select=*", headers=HEADERS)
    return res.json() if res.ok else []

def supabase_insert(table, data):
    res = requests.post(f"{SUPABASE_URL}/rest/v1/{table}", headers={**HEADERS, "Content-Type": "application/json"}, json=data)
    return res.ok

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/api/login", methods=["POST"])
def login():
    code = request.json.get("code")
    codes = supabase_get("access_codes")
    match = next((c for c in codes if c["code"] == code), None)
    if not match:
        return jsonify({"success": False, "message": "Invalid access code"}), 401
    log = {
        "code": code,
        "role": match["role"],
        "user_agent": request.headers.get("User-Agent"),
        "timestamp": datetime.utcnow().isoformat()
    }
    supabase_insert("access_logs", log)
    return jsonify({"success": True, "role": match["role"]})

@app.route("/api/announcements", methods=["GET", "POST"])
def announcements():
    if request.method == "GET":
        return jsonify(supabase_get("announcements"))
    data = request.json
    data["timestamp"] = datetime.utcnow().isoformat()
    return jsonify({"success": supabase_insert("announcements", data)})

@app.route("/api/suggestions", methods=["GET", "POST"])
def suggestions():
    if request.method == "GET":
        return jsonify(supabase_get("suggestions"))
    data = request.json
    data["votes"] = 0
    data["timestamp"] = datetime.utcnow().isoformat()
    return jsonify({"success": supabase_insert("suggestions", data)})

@app.route("/api/suggestions/vote", methods=["POST"])
def vote_suggestion():
    suggestion_id = request.json.get("id")
    if not suggestion_id:
        return jsonify({"success": False}), 400
    res = requests.post(
        f"{SUPABASE_URL}/rest/v1/rpc/increment_vote",
        headers={**HEADERS, "Content-Type": "application/json"},
        json={"suggestion_id": suggestion_id}
    )
    return jsonify({"success": res.status_code == 200})

@app.route("/api/comments", methods=["GET", "POST"])
def comments():
    if request.method == "GET":
        return jsonify(supabase_get("suggestion_comments"))
    data = request.json
    data["timestamp"] = datetime.utcnow().isoformat()
    return jsonify({"success": supabase_insert("suggestion_comments", data)})

@app.route("/api/chat", methods=["GET", "POST"])
def chat():
    if request.method == "GET":
        return jsonify(supabase_get("chat_messages"))
    data = request.json
    data["timestamp"] = datetime.utcnow().isoformat()
    return jsonify({"success": supabase_insert("chat_messages", data)})

@app.route("/api/stock-guide", methods=["GET", "POST"])
def stock_guide():
    if request.method == "GET":
        guide = supabase_get("stock_guide")
        return jsonify(guide[0] if guide else {})
    content = request.json.get("content", "")
    return jsonify({
        "success": supabase_insert("stock_guide", {
            "id": 1,
            "content": content,
            "updated_at": datetime.utcnow().isoformat()
        })
    })

@app.route("/api/files", methods=["GET", "POST"])
def files():
    if request.method == "GET":
        return jsonify(supabase_get("files"))
    data = request.json
    data["uploaded_at"] = datetime.utcnow().isoformat()
    return jsonify({"success": supabase_insert("files", data)})

@app.route("/api/users", methods=["GET", "POST"])
def users():
    if request.method == "GET":
        return jsonify(supabase_get("users"))
    data = request.json
    data["joined_at"] = datetime.utcnow().isoformat()
    return jsonify({"success": supabase_insert("users", data)})

@app.route("/api/access-codes", methods=["GET", "POST", "DELETE"])
def access_codes():
    if request.method == "GET":
        return jsonify(supabase_get("access_codes"))
    if request.method == "POST":
        data = request.json
        return jsonify({"success": supabase_insert("access_codes", {
            "code": data.get("code"),
            "role": data.get("role"),
            "created_at": datetime.utcnow().isoformat()
        })})
    if request.method == "DELETE":
        code = request.json.get("code")
        res = requests.delete(
            f"{SUPABASE_URL}/rest/v1/access_codes?code=eq.{code}",
            headers=HEADERS
        )
        return jsonify({"success": res.status_code == 204})

# ✅ FINAL LINE FOR RENDER DEPLOYMENT
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port)
