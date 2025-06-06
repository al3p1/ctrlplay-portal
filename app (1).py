from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from supabase import supabase_get, supabase_insert
from datetime import datetime
import uuid

app = Flask(__name__)
CORS(app)

ACCESS_CODES = {
    "CP-TEAM-K9QX-V3ZT": "employee",
    "CP-ADMIN-Z84L-X9KT": "admin"
}

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/api/login", methods=["POST"])
def login():
    code = request.json.get("code")
    role = ACCESS_CODES.get(code)
    if not role:
        return jsonify({"success": False, "message": "Invalid access code"}), 401

    log = {
        "code": code,
        "role": role,
        "user_agent": request.headers.get("User-Agent"),
        "timestamp": datetime.utcnow().isoformat()
    }
    supabase_insert("access_logs", log)
    return jsonify({"success": True, "role": role})

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

@app.route("/api/access-codes", methods=["GET", "POST"])
def access_codes():
    if request.method == "GET":
        return jsonify(supabase_get("access_codes"))
    data = request.json
    return jsonify({"success": supabase_insert("access_codes", {
        "code": data.get("code"),
        "role": data.get("role"),
        "created_at": datetime.utcnow().isoformat()
    })})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=10000)