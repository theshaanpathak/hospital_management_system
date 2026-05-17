import requests
import json
import jwt

JWT_SECRET = "mysecretkey"

def generate_mock_token(user_id=1, role="patient"):
    payload = {
        "id": user_id,
        "role": role
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm="HS256")
    # If jwt.encode returns bytes, decode it to string
    if isinstance(token, bytes):
        token = token.decode("utf-8")
    return token

def test_query(question, role="patient", user_id=1):
    url = "http://127.0.0.1:8000/ask"
    token = generate_mock_token(user_id=user_id, role=role)
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    payload = {"query": question}
    
    try:
        response = requests.post(url, json=payload, headers=headers)
        print(f"Role: {role.upper()} (User ID: {user_id})")
        print(f"Question: {question}")
        print(f"Status Code: {response.status_code}")
        try:
            print(f"Response: {json.dumps(response.json(), indent=2)}")
        except Exception:
            print(f"Raw Response: {response.text}")
        print("-" * 50)
    except Exception as e:
        print(f"Error testing question '{question}': {e}")
        print("-" * 50)

if __name__ == "__main__":
    print("🚀 Running AI Verification Script...")
    
    print("\n--- TEST 1: Patient Role ---")
    test_query("What are the available doctors?", role="patient", user_id=1)
    
    print("\n--- TEST 2: Doctor Role ---")
    test_query("Show my clinical schedule", role="doctor", user_id=2)
    
    print("\n--- TEST 3: Admin Role ---")
    test_query("Get hospital analytics summary", role="admin", user_id=3)
