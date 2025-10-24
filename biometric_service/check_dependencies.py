#!/usr/bin/env python3
"""
Dependency checker for Biometric Verification Service.
Verifies that all required packages are installed and working.
"""
import sys


def check_python_version():
    """Check if Python version is 3.8 or higher."""
    print("🐍 Checking Python version...")
    version = sys.version_info
    if version.major >= 3 and version.minor >= 8:
        print(f"   ✅ Python {version.major}.{version.minor}.{version.micro}")
        return True
    else:
        print(f"   ❌ Python {version.major}.{version.minor}.{version.micro} (3.8+ required)")
        return False


def check_package(package_name, import_name=None):
    """Check if a package is installed and can be imported."""
    if import_name is None:
        import_name = package_name
    
    try:
        module = __import__(import_name)
        version = getattr(module, '__version__', 'unknown')
        print(f"   ✅ {package_name} ({version})")
        return True
    except ImportError:
        print(f"   ❌ {package_name} - NOT INSTALLED")
        return False


def check_opencv():
    """Special check for OpenCV."""
    try:
        import cv2
        version = cv2.__version__
        print(f"   ✅ opencv-python ({version})")
        return True
    except ImportError:
        print(f"   ❌ opencv-python - NOT INSTALLED")
        return False


def check_face_recognition():
    """Special check for face_recognition with dlib dependency."""
    try:
        import face_recognition
        # Try to use it to ensure dlib is also working
        import dlib
        print(f"   ✅ face_recognition")
        print(f"   ✅ dlib ({dlib.__version__})")
        return True
    except ImportError as e:
        print(f"   ❌ face_recognition/dlib - {str(e)}")
        return False


def main():
    """Run all dependency checks."""
    print("=" * 60)
    print("🔍 BIOMETRIC SERVICE DEPENDENCY CHECKER")
    print("=" * 60)
    
    results = []
    
    # Check Python version
    results.append(check_python_version())
    
    print("\n📦 Checking core packages...")
    results.append(check_package("fastapi"))
    results.append(check_package("uvicorn"))
    results.append(check_package("pydantic"))
    
    print("\n🖼️  Checking image processing packages...")
    results.append(check_opencv())
    results.append(check_package("numpy"))
    results.append(check_package("PIL", "PIL"))
    
    print("\n👤 Checking face recognition packages...")
    results.append(check_face_recognition())
    
    print("\n" + "=" * 60)
    
    passed = sum(results)
    total = len(results)
    
    if passed == total:
        print(f"✅ ALL CHECKS PASSED ({passed}/{total})")
        print("\n🎉 You're ready to run the service!")
        print("\nNext steps:")
        print("  1. Run: uvicorn app:app --reload")
        print("  2. Open: http://localhost:8000/docs")
        print("  3. Test: python test_api.py")
        return 0
    else:
        print(f"❌ SOME CHECKS FAILED ({total - passed}/{total})")
        print("\n🔧 To install missing dependencies:")
        print("  pip install -r requirements.txt")
        print("\n⚠️  If dlib/face_recognition fails:")
        print("  # Ubuntu/Debian:")
        print("  sudo apt-get install cmake build-essential")
        print("  pip install dlib")
        print("\n  # macOS:")
        print("  brew install cmake")
        print("  pip install dlib")
        return 1


if __name__ == "__main__":
    sys.exit(main())
