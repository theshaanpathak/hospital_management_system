import requests
import json

def test_query(question):
    url = "http://127.0.0.1:8003/ask"
    payload = {"question": question}
    try:
        response = requests.post(url, json=payload)
        print(f"Question: {question}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        print("-" * 30)
    except Exception as e:
        print(f"Error testing question '{question}': {e}")

if __name__ == "__main__":
    print("Testing AI Assistant...")
    test_query("What are the OPD timings?")
    test_query("I want to book an appointment with a cardiologist")
    test_query("Do you have a neurology department?")
    test_query("What is the weather like?")
