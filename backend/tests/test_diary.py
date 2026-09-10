import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def get_auth_token():
    res = client.post("/api/v1/auth/login", json={
        "email": "jothiram@lifebook.ai",
        "password": "LifeBook2026!"
    })
    assert res.status_code == 200
    return res.json()["access_token"]

def test_create_text_entry_and_status():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    res = client.post("/api/v1/diary/text", headers=headers, json={
        "raw_text": "Today I went to college with Ravi and we worked on our SIH project.",
        "title": "College SIH Sprint"
    })
    assert res.status_code == 200
    entry = res.json()
    assert entry["status"] in ["RECEIVED", "SAVED"]
    assert entry["input_type"] == "text"
    
    # Check status endpoint
    status_res = client.get(f"/api/v1/diary/{entry['id']}/status", headers=headers)
    assert status_res.status_code == 200
    assert "status" in status_res.json()

def test_confirm_entry():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    # Create entry
    res = client.post("/api/v1/diary/text", headers=headers, json={
        "raw_text": "Customer meeting in Madurai with Ravi.",
        "title": "Madurai Visit"
    })
    entry = res.json()

    # Confirm
    conf_res = client.post(f"/api/v1/diary/{entry['id']}/confirm", headers=headers, json={
        "confirmed_title": "Confirmed Madurai Visit",
        "confirmed_content": "Today I went to Madurai for a customer meeting with Ravi."
    })
    assert conf_res.status_code == 200
    assert conf_res.json()["status"] == "COMPLETED"
