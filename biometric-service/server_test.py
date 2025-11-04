# Simple script to test biometric service endpoints (python)
# Use `python server_test.py` after starting the biometric service to perform a basic health check.
import requests

BASE = "http://localhost:8000"

def health():
    r = requests.get(f"{BASE}/api/health")
    print('health', r.status_code, r.text)

if __name__ == '__main__':
    health()
