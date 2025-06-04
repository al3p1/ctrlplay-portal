import requests

SUPABASE_URL = "https://nyqjeyruewajkkyohplw.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json"
}

def supabase_get(table):
    res = requests.get(f"{SUPABASE_URL}/rest/v1/{table}?select=*", headers=HEADERS)
    return res.json()

def supabase_insert(table, data):
    res = requests.post(f"{SUPABASE_URL}/rest/v1/{table}", json=data, headers=HEADERS)
    return res.status_code == 201
