# 🚀 Deployment Guide

This guide covers various deployment options for the Biometric Verification Service.

## 📋 Prerequisites

- Python 3.8+
- Docker (optional, for containerized deployment)
- Reverse proxy (nginx/Apache) for production
- SSL certificate (for HTTPS)

## 🔧 Deployment Options

### Option 1: Local/Development Deployment

```bash
# Quick start
./start.sh

# Or manually
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

### Option 2: Docker Deployment

#### Build and Run

```bash
# Build the image
docker build -t biometric-service .

# Run the container
docker run -d \
  -p 8000:8000 \
  -v $(pwd)/data:/app/data \
  --name biometric-service \
  biometric-service
```

#### Using Docker Compose

```bash
# Start service
docker-compose up -d

# View logs
docker-compose logs -f

# Stop service
docker-compose down
```

### Option 3: Production Deployment with Nginx

#### 1. Set up the Python service

```bash
# Create a system user
sudo useradd -r -s /bin/false biometric

# Copy files to /opt
sudo mkdir -p /opt/biometric-service
sudo cp -r . /opt/biometric-service/
sudo chown -R biometric:biometric /opt/biometric-service

# Set up virtual environment
cd /opt/biometric-service
sudo -u biometric python3 -m venv venv
sudo -u biometric venv/bin/pip install -r requirements.txt
```

#### 2. Create systemd service

Create `/etc/systemd/system/biometric.service`:

```ini
[Unit]
Description=Biometric Verification Service
After=network.target

[Service]
Type=simple
User=biometric
Group=biometric
WorkingDirectory=/opt/biometric-service
Environment="PATH=/opt/biometric-service/venv/bin"
ExecStart=/opt/biometric-service/venv/bin/uvicorn app:app --host 127.0.0.1 --port 8000
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable biometric
sudo systemctl start biometric
sudo systemctl status biometric
```

#### 3. Configure Nginx reverse proxy

Create `/etc/nginx/sites-available/biometric`:

```nginx
server {
    listen 80;
    server_name biometric.yourdomain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name biometric.yourdomain.com;

    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/biometric.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/biometric.yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    add_header X-XSS-Protection "1; mode=block";

    # Proxy to FastAPI
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Increase max body size for images
    client_max_body_size 10M;
}
```

Enable and restart nginx:

```bash
sudo ln -s /etc/nginx/sites-available/biometric /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 4. Get SSL certificate (Let's Encrypt)

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d biometric.yourdomain.com
```

### Option 4: Cloud Deployment

#### AWS EC2

```bash
# Launch EC2 instance (Ubuntu 20.04+)
# SSH into instance
ssh -i your-key.pem ubuntu@your-instance-ip

# Install dependencies
sudo apt-get update
sudo apt-get install -y python3-pip python3-venv cmake build-essential

# Clone/upload your code
git clone your-repo
cd biometric_service

# Follow Option 3 steps for systemd + nginx
```

#### Google Cloud Platform

```bash
# Create VM instance
gcloud compute instances create biometric-service \
  --zone=us-central1-a \
  --machine-type=e2-medium \
  --image-family=ubuntu-2004-lts \
  --image-project=ubuntu-os-cloud

# SSH and setup
gcloud compute ssh biometric-service
# Follow setup steps
```

#### Heroku

Create `Procfile`:

```
web: uvicorn app:app --host 0.0.0.0 --port $PORT
```

Deploy:

```bash
heroku create your-biometric-service
heroku buildpacks:add --index 1 heroku/python
git push heroku main
```

## 🔒 Production Security Checklist

- [ ] Enable HTTPS with valid SSL certificate
- [ ] Set `ALLOWED_ORIGINS` to specific domains
- [ ] Generate strong `SECRET_KEY`
- [ ] Enable `ENABLE_ENCRYPTION=true`
- [ ] Set up firewall rules (allow only 443, 22)
- [ ] Implement rate limiting
- [ ] Add API authentication (JWT/API keys)
- [ ] Enable audit logging
- [ ] Set up monitoring and alerts
- [ ] Regular security updates
- [ ] Backup face data regularly
- [ ] Implement DDoS protection
- [ ] Use environment variables for secrets (never commit)

## 📊 Monitoring

### Health Check

```bash
# Basic check
curl https://biometric.yourdomain.com/health

# Continuous monitoring
watch -n 30 'curl -s https://biometric.yourdomain.com/health | jq'
```

### Logs

```bash
# systemd service logs
sudo journalctl -u biometric -f

# Docker logs
docker logs -f biometric-service

# Docker Compose logs
docker-compose logs -f
```

### Metrics

Consider integrating:
- **Prometheus**: For metrics collection
- **Grafana**: For visualization
- **Sentry**: For error tracking
- **DataDog**: For APM

## 🔄 Updates and Maintenance

### Update the service

```bash
# Pull latest code
cd /opt/biometric-service
sudo -u biometric git pull

# Update dependencies
sudo -u biometric venv/bin/pip install -r requirements.txt

# Restart service
sudo systemctl restart biometric
```

### Backup face data

```bash
# Backup embeddings
sudo tar -czf biometric-backup-$(date +%Y%m%d).tar.gz /opt/biometric-service/data/

# Restore
sudo tar -xzf biometric-backup-20240101.tar.gz -C /
```

## 🧪 Testing Production Deployment

```bash
# Test endpoints
curl https://biometric.yourdomain.com/health
curl https://biometric.yourdomain.com/

# Load testing
pip install locust
locust -f load_test.py --host https://biometric.yourdomain.com
```

## 📈 Scaling

### Vertical Scaling
- Increase CPU/RAM on server
- Use faster storage (SSD)

### Horizontal Scaling
- Use load balancer (nginx, HAProxy)
- Run multiple instances
- Shared storage for face data (NFS, S3)

### Example: Load Balancer Setup

```nginx
upstream biometric_backend {
    least_conn;
    server 127.0.0.1:8000;
    server 127.0.0.1:8001;
    server 127.0.0.1:8002;
}

server {
    listen 443 ssl;
    server_name biometric.yourdomain.com;
    
    location / {
        proxy_pass http://biometric_backend;
        # ... rest of config
    }
}
```

## 🆘 Troubleshooting

### Service won't start

```bash
# Check logs
sudo journalctl -u biometric -n 50

# Check port availability
sudo netstat -tulpn | grep 8000

# Check file permissions
ls -la /opt/biometric-service
```

### High memory usage

```bash
# Monitor resources
htop

# Restart service
sudo systemctl restart biometric
```

### SSL certificate issues

```bash
# Renew certificate
sudo certbot renew

# Test nginx config
sudo nginx -t
```

## 📞 Support

For deployment issues:
1. Check logs first
2. Review this guide
3. Test with `curl` commands
4. Check firewall/security groups

---

**Remember**: Always test in a staging environment before deploying to production!
