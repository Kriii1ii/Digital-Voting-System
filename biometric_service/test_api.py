#!/usr/bin/env python3
"""
Simple test script for the Biometric Service API
Tests basic functionality without requiring actual images
"""

import requests
import base64
from PIL import Image
import io
import sys

API_URL = "http://localhost:8000"

def create_test_image():
    """Create a simple test image (colored square)"""
    img = Image.new('RGB', (640, 480), color=(73, 109, 137))
    buffer = io.BytesIO()
    img.save(buffer, format='JPEG')
    img_bytes = buffer.getvalue()
    img_base64 = base64.b64encode(img_bytes).decode()
    return f"data:image/jpeg;base64,{img_base64}"

def test_health():
    """Test health endpoint"""
    print("\n🔍 Testing /health endpoint...")
    try:
        response = requests.get(f"{API_URL}/health")
        response.raise_for_status()
        data = response.json()
        print(f"✅ Health check passed")
        print(f"   Status: {data['status']}")
        print(f"   Version: {data['version']}")
        print(f"   Services: {data['services']}")
        return True
    except Exception as e:
        print(f"❌ Health check failed: {e}")
        return False

def test_root():
    """Test root endpoint"""
    print("\n🔍 Testing / endpoint...")
    try:
        response = requests.get(f"{API_URL}/")
        response.raise_for_status()
        data = response.json()
        print(f"✅ Root endpoint passed")
        print(f"   Service: {data['service']}")
        return True
    except Exception as e:
        print(f"❌ Root endpoint failed: {e}")
        return False

def test_quality_check():
    """Test quality check endpoint"""
    print("\n🔍 Testing /face/quality-check endpoint...")
    try:
        image_data = create_test_image()
        response = requests.post(
            f"{API_URL}/face/quality-check",
            json={"imageBase64": image_data}
        )
        response.raise_for_status()
        data = response.json()
        print(f"✅ Quality check completed")
        print(f"   Passed: {data['passed']}")
        print(f"   Metrics: {data['metrics']}")
        if not data['passed']:
            print(f"   Reasons: {data['reasons']}")
        return True
    except Exception as e:
        print(f"❌ Quality check failed: {e}")
        return False

def test_fingerprint_simulation():
    """Test fingerprint simulation endpoint"""
    print("\n🔍 Testing /fingerprint/simulate endpoint...")
    try:
        response = requests.get(f"{API_URL}/fingerprint/simulate")
        response.raise_for_status()
        data = response.json()
        print(f"✅ Fingerprint simulation passed")
        print(f"   Status: {data['status']}")
        return True
    except Exception as e:
        print(f"❌ Fingerprint simulation failed: {e}")
        return False

def test_fingerprint_register():
    """Test fingerprint registration"""
    print("\n🔍 Testing /fingerprint/register endpoint...")
    try:
        response = requests.post(
            f"{API_URL}/fingerprint/register",
            json={"user_id": "test_user_123", "fingerprint_data": "test_data"}
        )
        response.raise_for_status()
        data = response.json()
        print(f"✅ Fingerprint registration passed")
        print(f"   Success: {data['success']}")
        print(f"   Message: {data['message']}")
        return True
    except Exception as e:
        print(f"❌ Fingerprint registration failed: {e}")
        return False

def test_fingerprint_authenticate():
    """Test fingerprint authentication"""
    print("\n🔍 Testing /fingerprint/authenticate endpoint...")
    try:
        response = requests.post(
            f"{API_URL}/fingerprint/authenticate",
            json={"user_id": "test_user_123", "fingerprint_data": "test_data"}
        )
        response.raise_for_status()
        data = response.json()
        print(f"✅ Fingerprint authentication passed")
        print(f"   Success: {data['success']}")
        print(f"   Message: {data['message']}")
        return True
    except Exception as e:
        print(f"❌ Fingerprint authentication failed: {e}")
        return False

def main():
    """Run all tests"""
    print("=" * 60)
    print("🧪 Biometric Service API Test Suite")
    print("=" * 60)
    
    # Check if service is running
    print("\n📡 Checking if service is running...")
    try:
        requests.get(f"{API_URL}/health", timeout=2)
        print("✅ Service is running")
    except requests.exceptions.ConnectionError:
        print(f"❌ Cannot connect to service at {API_URL}")
        print("   Make sure the service is running: python app.py")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)
    
    # Run tests
    results = []
    results.append(("Health Check", test_health()))
    results.append(("Root Endpoint", test_root()))
    results.append(("Quality Check", test_quality_check()))
    results.append(("Fingerprint Simulation", test_fingerprint_simulation()))
    results.append(("Fingerprint Register", test_fingerprint_register()))
    results.append(("Fingerprint Authenticate", test_fingerprint_authenticate()))
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 Test Summary")
    print("=" * 60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {test_name}")
    
    print(f"\n{passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests passed!")
        sys.exit(0)
    else:
        print(f"\n⚠️  {total - passed} test(s) failed")
        sys.exit(1)

if __name__ == "__main__":
    main()
