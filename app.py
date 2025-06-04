from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from supabase.supabase import supabase_get, supabase_insert
from datetime import datetime

app = Flask(__name__)
CORS(app)

ACCESS_CODES = {
    "CP-TEAM-K9QX-V3ZT": "employee",
    "CP-ADMIN-Z84L-X9KT": "admin"
}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/login', methods=['POST'])
def login():
    code = request.json.get("code")
    role = ACCESS_CODES.get(code)
    if not role:
        return jsonify({"success": False, "message": "Invalid code"}), 401
    log = {
        "code": code,
        "role": role,
        "timestamp": datetime.utcnow().isoformat(),
        "user_agent": request.headers.get("User-Agent")
    }
    supabase_insert("access_logs", log)
    return jsonify({"success": True, "role": role})

@app.route('/api/announcements', methods=['GET', 'POST'])
def announcements():
    if request.method == 'GET':
        return jsonify(supabase_get("announcements"))
    data = request.json
    data["timestamp"] = datetime.utcnow().isoformat()
    success = supabase_insert("announcements", data)
    return jsonify({"success": success})

@app.route('/api/suggestions', methods=['GET', 'POST'])
def suggestions():
    if request.method == 'GET':
        return jsonify(supabase_get("suggestions"))
    data = request.json
    data["votes"] = 0
    data["timestamp"] = datetime.utcnow().isoformat()
    success = supabase_insert("suggestions", data)
    return jsonify({"success": success})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=10000)