# GameHub Deployment Guide

## Prerequisites

### Required Software
- Node.js 18+ 
- PostgreSQL 14+
- Redis 6+
- npm or yarn

### Optional
- Docker & Docker Compose
- Nginx (for production)
- PM2 (for process management)

---

## Environment Setup

### Backend Environment Variables

Create `backend/.env`:

```bash
# Application
NODE_ENV=production
PORT=3000
APP_NAME=GameHub

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=gamehub
DB_PASSWORD=your_secure_password
DB_NAME=gamehub_db

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# JWT
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# File Storage
UPLOAD_DIR=./uploads/games
MAX_FILE_SIZE=104857600  # 100MB

# Storage Quotas (bytes)
STORAGE_QUOTA_FREE=1073741824       # 1GB
STORAGE_QUOTA_MEMBER=5368709120     # 5GB
STORAGE_QUOTA_OFFLINE=21474836480   # 20GB

# WebSocket
WS_PORT=3000

# CORS
CORS_ORIGIN=https://your-domain.com
```

### Frontend Environment Variables

Create `frontend/.env.production`:

```bash
VITE_API_BASE_URL=https://api.your-domain.com
VITE_WS_URL=wss://api.your-domain.com
```

---

## Database Setup

### 1. Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database and user
CREATE DATABASE gamehub_db;
CREATE USER gamehub WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE gamehub_db TO gamehub;
```

### 2. Run Migrations

```bash
cd backend
npm run migration:run
```

### 3. Seed Initial Data (Optional)

```bash
npm run seed
```

---

## Build Instructions

### Backend Build

```bash
cd backend
npm install
npm run build

# Output: dist/
```

### Frontend Build

```bash
cd frontend
npm install
npm run build

# Output: dist/
```

---

## Deployment Options

### Option 1: Docker Deployment (Recommended)

#### 1. Create Docker Compose File

`docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: gamehub_db
      POSTGRES_USER: gamehub
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:6-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"

  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      DB_HOST: postgres
      REDIS_HOST: redis
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

#### 2. Deploy with Docker Compose

```bash
docker-compose -f docker-compose.prod.yml up -d
```

---

### Option 2: Manual Deployment

#### 1. Install Dependencies

```bash
# Backend
cd backend
npm ci --production

# Frontend
cd frontend
npm ci --production
```

#### 2. Start Services

```bash
# Backend
cd backend
npm run start:prod

# Or with PM2
pm2 start dist/main.js --name gamehub-backend

# Frontend - Serve static files with Nginx
# (See Nginx configuration below)
```

---

### Option 3: Cloud Platform Deployment

#### Heroku

```bash
# Backend
heroku create gamehub-api
heroku addons:create heroku-postgresql:hobby-dev
heroku addons:create heroku-redis:hobby-dev
git subtree push --prefix backend heroku main

# Frontend
heroku create gamehub-frontend
heroku buildpacks:set heroku/nodejs
git subtree push --prefix frontend heroku main
```

#### Vercel (Frontend Only)

```bash
cd frontend
vercel --prod
```

#### Railway

```bash
# Install Railway CLI
npm i -g @railway/cli

# Deploy
railway login
railway init
railway up
```

---

## Nginx Configuration

### Backend Reverse Proxy

`/etc/nginx/sites-available/gamehub-api`:

```nginx
server {
    listen 80;
    server_name api.your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://localhost:3000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### Frontend Static Hosting

`/etc/nginx/sites-available/gamehub-frontend`:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/gamehub/frontend/dist;
    index index.html;

    # Enable gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## SSL/TLS Configuration

### Using Let's Encrypt (Certbot)

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com -d api.your-domain.com

# Auto-renewal
sudo certbot renew --dry-run
```

---

## Process Management with PM2

### Start Application

```bash
# Backend
pm2 start dist/main.js --name gamehub-backend

# Configure auto-restart
pm2 startup
pm2 save
```

### PM2 Ecosystem File

`ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'gamehub-backend',
    script: './dist/main.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production'
    }
  }]
};
```

```bash
pm2 start ecosystem.config.js
```

---

## Health Checks

### Backend Health Endpoint

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "database": "connected",
  "redis": "connected"
}
```

---

## Monitoring

### Application Logs

```bash
# PM2 logs
pm2 logs gamehub-backend

# Docker logs
docker logs gamehub-backend

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### Performance Monitoring

- Install APM tool (New Relic, Datadog, or PM2 Plus)
- Monitor CPU, memory, response times
- Set up alerts for errors and downtime

---

## Backup Strategy

### Database Backup

```bash
# Manual backup
pg_dump -U gamehub gamehub_db > backup_$(date +%Y%m%d).sql

# Restore
psql -U gamehub gamehub_db < backup_20241112.sql

# Automated backup with cron
0 2 * * * pg_dump -U gamehub gamehub_db > /backups/gamehub_$(date +\%Y\%m\%d).sql
```

### File Storage Backup

```bash
# Backup uploads directory
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz uploads/

# Sync to cloud storage (AWS S3 example)
aws s3 sync uploads/ s3://gamehub-backups/uploads/
```

---

## Scaling

### Horizontal Scaling

1. **Load Balancer**: Use Nginx or cloud load balancer
2. **Multiple Backend Instances**: Run multiple PM2 clusters
3. **Session Store**: Use Redis for session management
4. **Database Replicas**: Set up read replicas

### Vertical Scaling

- Increase server resources (CPU, RAM)
- Optimize database queries
- Implement caching strategies

---

## Production Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] SSL certificates obtained
- [ ] Backup strategy in place

### Security
- [ ] Change default passwords
- [ ] Enable rate limiting
- [ ] Configure CORS properly
- [ ] Set up firewall rules
- [ ] Enable HTTPS only

### Performance
- [ ] Enable gzip compression
- [ ] Configure CDN for static assets
- [ ] Database indexes created
- [ ] Caching configured
- [ ] Bundle size optimized

### Monitoring
- [ ] Health checks configured
- [ ] Logging set up
- [ ] Error tracking enabled
- [ ] Performance monitoring active
- [ ] Alerts configured

---

## Troubleshooting

### Common Issues

**Database Connection Errors**
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check connection
psql -U gamehub -d gamehub_db
```

**Redis Connection Errors**
```bash
# Check Redis status
redis-cli ping

# Test connection
redis-cli -h localhost -p 6379 -a your_password
```

**High Memory Usage**
```bash
# Check Node.js process
pm2 monit

# Restart if needed
pm2 restart gamehub-backend
```

---

## Rollback Procedure

1. **Stop current deployment**
   ```bash
   pm2 stop gamehub-backend
   ```

2. **Restore previous version**
   ```bash
   git checkout <previous-commit>
   npm install
   npm run build
   ```

3. **Restore database** (if needed)
   ```bash
   psql -U gamehub gamehub_db < backup_previous.sql
   ```

4. **Restart application**
   ```bash
   pm2 start gamehub-backend
   ```

---

## Support

For deployment issues, contact:
- Email: support@gamehub.com
- Slack: #deployment-support
- Documentation: https://docs.gamehub.com

---

**Version**: 1.0.0
**Last Updated**: 2024-11-12

