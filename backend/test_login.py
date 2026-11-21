import requests
import json

base_url = "http://localhost:8000/api/v1"
res = requests.post(f"{base_url}/auth/login", json={"email":"admin@company.com","password":"password"})
print("Login status:", res.status_code)
if res.status_code == 200:
    token = res.json().get("access_token")
    print("Got token:", token)
    res_me = requests.get(f"{base_url}/auth/me", headers={"Authorization": f"Bearer {token}"})
    print("Me status:", res_me.status_code)
    print("Me response:", res_me.text)
else:
    print("Login failed:", res.text)
