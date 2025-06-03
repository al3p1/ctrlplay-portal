from flask import Flask, render_template, request, jsonify, send_from_directory
import json, os
from datetime import datetime
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

DATA_PATH = 'data'
FILES_PATH = 'static/files'
os.makedirs(DATA_PATH, exist_ok=True)
os.makedirs(FILES_PATH, exist_ok=True)

ACCESS_CODES = {
    "CP-TEAM-K9QX-V3ZT": "employee",
    "CP-ADMIN-Z84L-X9KT": "admin"
}

def load_json(filename):
    path = os.path.join(DATA_PATH, filename)
    if not os.path.exists(path):
        return []
    with open(path, 'r') as f:
        return json.load(f)

def save_json(filename, data):
    with open(os.path.join(DATA_PATH, filename), 'w') as f:
        json.dump(data, f, indent=2)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/api/login', methods=['POST'])
def login():
    code = request.json.get('code')
    role = ACCESS_CODES.get(code)
    if not role:
        return jsonify({"success": False, "message": "Invalid code"}), 401
    logs = load_json("access_logs.json")
    logs.append({
        "code": code,
        "role": role,
        "timestamp": datetime.utcnow().isoformat(),
        "agent": request.headers.get('User-Agent')
    })
    save_json("access_logs.json", logs)
    return jsonify({"success": True, "role": role})

@app.route('/api/announcements', methods=['GET', 'POST'])
def announcements():
    if request.method == 'GET':
        return jsonify(load_json("announcements.json"))
    data = request.json
    ann = load_json("announcements.json")
    ann.append({
        "title": data.get("title"),
        "body": data.get("body"),
        "timestamp": datetime.utcnow().isoformat()
    })
    save_json("announcements.json", ann)
    return jsonify({"success": True})

@app.route('/api/suggestions', methods=['GET', 'POST'])
def suggestions():
    if request.method == 'GET':
        return jsonify(load_json("suggestions.json"))
    data = request.json
    sugg = load_json("suggestions.json")
    sugg.append({
        "message": data.get("message"),
        "votes": 0,
        "timestamp": datetime.utcnow().isoformat()
    })
    save_json("suggestions.json", sugg)
    return jsonify({"success": True})

@app.route('/api/files', methods=['GET'])
def list_files():
    files = os.listdir(FILES_PATH)
    return jsonify(files)

@app.route('/upload', methods=['POST'])
def upload():
    f = request.files['file']
    path = os.path.join(FILES_PATH, f.filename)
    f.save(path)
    return jsonify({"success": True})

@app.route('/files/<filename>')
def get_file(filename):
    return send_from_directory(FILES_PATH, filename)

if __name__ == '__main__':
    app.run(debug=True)
