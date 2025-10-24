# 🤝 Contributing to Biometric Verification Service

Thank you for your interest in contributing to this project!

## 🎯 Project Structure

```
biometric_service/
├── app.py                  # Main FastAPI application
├── config.py              # Configuration management
├── models/                # Pydantic data models
│   └── user_faces.py
├── utils/                 # Utility functions
│   ├── face_utils.py     # Face recognition helpers
│   └── quality_check.py  # Image quality validation
├── data/                  # Face embeddings storage
├── examples/              # Integration examples
└── tests/                 # Unit tests (to be added)
```

## 🔧 Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/yourusername/biometric-service.git
   cd biometric-service
   ```

2. **Create Virtual Environment**
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   pip install -r requirements-dev.txt  # If available
   ```

4. **Run in Development Mode**
   ```bash
   uvicorn app:app --reload
   ```

## 🧪 Testing

Before submitting a PR:

1. **Run Tests**
   ```bash
   python test_api.py
   ```

2. **Check Code Style**
   ```bash
   # Install flake8 and black
   pip install flake8 black

   # Check style
   flake8 .
   black --check .

   # Auto-format
   black .
   ```

3. **Test Your Changes**
   - Test all affected endpoints
   - Verify backward compatibility
   - Check error handling

## 📝 Code Guidelines

### Python Style
- Follow PEP 8
- Use type hints where possible
- Write docstrings for functions and classes
- Keep functions focused and small

### Commit Messages
- Use clear, descriptive messages
- Format: `type: description`
- Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`

Examples:
```
feat: add anti-spoofing liveness detection
fix: improve face detection accuracy in low light
docs: update API documentation for quality check
```

### Pull Requests
- Create a branch for your feature: `git checkout -b feature/your-feature`
- Keep PRs focused on a single feature/fix
- Update documentation if needed
- Add tests for new features
- Ensure all tests pass

## 🎨 Areas for Contribution

### High Priority
- [ ] Add unit tests for all endpoints
- [ ] Implement liveness detection (anti-spoofing)
- [ ] Add database support (PostgreSQL/MongoDB)
- [ ] Improve error handling and logging
- [ ] Add API authentication (JWT/OAuth)

### Medium Priority
- [ ] Add rate limiting
- [ ] Implement face embedding encryption
- [ ] Add support for multiple faces per user
- [ ] Improve quality check algorithms
- [ ] Add more detailed metrics

### Nice to Have
- [ ] WebAuthn full implementation
- [ ] Support for additional biometric types
- [ ] Admin dashboard
- [ ] Real-time monitoring
- [ ] Multi-language support

## 🐛 Reporting Bugs

When reporting bugs, please include:

1. **Description**: Clear description of the issue
2. **Steps to Reproduce**: Exact steps to reproduce the bug
3. **Expected Behavior**: What you expected to happen
4. **Actual Behavior**: What actually happened
5. **Environment**: OS, Python version, package versions
6. **Logs**: Relevant error messages or logs

## 💡 Feature Requests

For feature requests:

1. **Use Case**: Describe the use case
2. **Proposed Solution**: Your idea for implementation
3. **Alternatives**: Other approaches you considered
4. **Impact**: Who will benefit from this feature

## 🔒 Security

If you discover a security vulnerability:

1. **DO NOT** open a public issue
2. Email the maintainers directly
3. Provide details about the vulnerability
4. Allow time for a fix before public disclosure

## 📄 License

By contributing, you agree that your contributions will be licensed under the same license as the project.

## 🙏 Thank You!

Every contribution helps make this project better. Thank you for taking the time to contribute!
