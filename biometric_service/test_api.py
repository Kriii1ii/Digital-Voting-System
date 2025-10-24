"""
Test script for the Biometric Verification Service API.
Run this to verify that the service is working correctly.
"""
import requests
import base64
import io
from PIL import Image, ImageDraw
import numpy as np


def create_test_image():
    """Create a simple test image with a face-like pattern."""
    # Create a 640x480 RGB image
    img = Image.new('RGB', (640, 480), color=(200, 200, 200))
    draw = ImageDraw.Draw(img)
    
    # Draw a simple face-like pattern
    # Head (circle)
    draw.ellipse([220, 140, 420, 340], fill=(255, 220, 177), outline=(0, 0, 0), width=2)
    
    # Eyes
    draw.ellipse([270, 200, 310, 240], fill=(255, 255, 255), outline=(0, 0, 0), width=2)
    draw.ellipse([330, 200, 370, 240], fill=(255, 255, 255), outline=(0, 0, 0), width=2)
    draw.ellipse([280, 210, 300, 230], fill=(0, 0, 0))
    draw.ellipse([340, 210, 360, 230], fill=(0, 0, 0))
    
    # Nose
    draw.polygon([(320, 240), (310, 270), (330, 270)], fill=(255, 200, 150), outline=(0, 0, 0))
    
    # Mouth
    draw.arc([280, 270, 360, 310], 0, 180, fill=(0, 0, 0), width=3)
    
    # Convert to base64
    buffered = io.BytesIO()
    img.save(buffered, format="JPEG")
    img_base64 = base64.b64encode(buffered.getvalue()).decode()
    
    return f"data:image/jpeg;base64,{img_base64}"


def test_health_check(base_url):
    """Test the health check endpoint."""
    print("\n🏥 Testing Health Check...")
    try:
        response = requests.get(f"{base_url}/health")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_quality_check(base_url, img_data):
    """Test the quality check endpoint."""
    print("\n🔍 Testing Quality Check...")
    try:
        response = requests.post(
            f"{base_url}/face/quality-check",
            json={"imageBase64": img_data}
        )
        print(f"Status Code: {response.status_code}")
        result = response.json()
        print(f"Passed: {result.get('passed')}")
        print(f"Reasons: {result.get('reasons')}")
        if 'metrics' in result:
            print(f"Metrics: {result.get('metrics')}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_registration(base_url, user_id, img_data):
    """Test face registration endpoint."""
    print(f"\n📝 Testing Face Registration for user: {user_id}...")
    try:
        response = requests.post(
            f"{base_url}/face/register",
            json={"user_id": user_id, "imageBase64": img_data}
        )
        print(f"Status Code: {response.status_code}")
        result = response.json()
        print(f"Success: {result.get('success')}")
        print(f"Message: {result.get('message')}")
        if 'embedding_shape' in result:
            print(f"Embedding Shape: {result.get('embedding_shape')}")
        if 'reasons' in result:
            print(f"Failure Reasons: {result.get('reasons')}")
        return result.get('success', False)
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_check_registration(base_url, user_id):
    """Test check registration endpoint."""
    print(f"\n✅ Checking Registration Status for user: {user_id}...")
    try:
        response = requests.get(f"{base_url}/face/check-registration/{user_id}")
        print(f"Status Code: {response.status_code}")
        result = response.json()
        print(f"Response: {result}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_authentication(base_url, user_id, img_data):
    """Test face authentication endpoint."""
    print(f"\n🔐 Testing Face Authentication for user: {user_id}...")
    try:
        response = requests.post(
            f"{base_url}/face/authenticate",
            json={"user_id": user_id, "imageBase64": img_data}
        )
        print(f"Status Code: {response.status_code}")
        result = response.json()
        print(f"Success: {result.get('success')}")
        print(f"Match: {result.get('match')}")
        print(f"Score: {result.get('score')}")
        print(f"Message: {result.get('message')}")
        return result.get('success', False)
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_fingerprint_registration(base_url, user_id):
    """Test fingerprint registration endpoint."""
    print(f"\n👆 Testing Fingerprint Registration for user: {user_id}...")
    try:
        response = requests.post(
            f"{base_url}/fingerprint/register",
            json={"user_id": user_id}
        )
        print(f"Status Code: {response.status_code}")
        result = response.json()
        print(f"Response: {result}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_fingerprint_authentication(base_url, user_id):
    """Test fingerprint authentication endpoint."""
    print(f"\n👆 Testing Fingerprint Authentication for user: {user_id}...")
    try:
        response = requests.post(
            f"{base_url}/fingerprint/authenticate",
            json={"user_id": user_id}
        )
        print(f"Status Code: {response.status_code}")
        result = response.json()
        print(f"Response: {result}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_reset_registration(base_url, user_id):
    """Test reset registration endpoint."""
    print(f"\n🗑️  Testing Reset Registration for user: {user_id}...")
    try:
        response = requests.delete(f"{base_url}/face/reset/{user_id}")
        print(f"Status Code: {response.status_code}")
        result = response.json()
        print(f"Response: {result}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def main():
    """Run all tests."""
    print("=" * 60)
    print("🧪 BIOMETRIC SERVICE API TEST SUITE")
    print("=" * 60)
    
    base_url = "http://localhost:8000"
    test_user_id = "test_user_001"
    
    # Check if service is running
    print(f"\n🔌 Checking if service is running at {base_url}...")
    try:
        response = requests.get(f"{base_url}/")
        print(f"✅ Service is running!")
        print(f"Response: {response.json()}")
    except requests.exceptions.ConnectionError:
        print(f"❌ Cannot connect to service at {base_url}")
        print("Please ensure the service is running:")
        print("  uvicorn app:app --reload")
        return
    
    # Create test image
    print("\n🎨 Creating test image...")
    img_data = create_test_image()
    print("✅ Test image created")
    
    # Run tests
    results = []
    
    results.append(("Health Check", test_health_check(base_url)))
    results.append(("Quality Check", test_quality_check(base_url, img_data)))
    results.append(("Face Registration", test_registration(base_url, test_user_id, img_data)))
    results.append(("Check Registration", test_check_registration(base_url, test_user_id)))
    results.append(("Face Authentication", test_authentication(base_url, test_user_id, img_data)))
    results.append(("Fingerprint Registration", test_fingerprint_registration(base_url, test_user_id)))
    results.append(("Fingerprint Authentication", test_fingerprint_authentication(base_url, test_user_id)))
    results.append(("Reset Registration", test_reset_registration(base_url, test_user_id)))
    
    # Print summary
    print("\n" + "=" * 60)
    print("📊 TEST SUMMARY")
    print("=" * 60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {test_name}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests passed!")
    else:
        print(f"\n⚠️  {total - passed} test(s) failed")
        print("\nNote: Some tests may fail if using a synthetic test image.")
        print("For best results, use a real photo of a face.")


if __name__ == "__main__":
    main()
