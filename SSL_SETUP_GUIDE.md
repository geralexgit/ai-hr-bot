# SSL Setup Guide for hr.agrsmv.ru

## Current Issue
Your containers are running correctly, but you're accessing `http://hr.agrsmv.ru:443/` instead of `https://hr.agrsmv.ru`. This happens because:

1. Docker is serving HTTP content on port 443
2. Browsers expect HTTPS on port 443
3. No SSL certificates are configured

## Solution 1: Nginx Reverse Proxy with SSL (Recommended)

### Step 1: Install Nginx and Certbot
```bash
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx -y
```

### Step 2: Get SSL Certificate
```bash
# Stop nginx temporarily if it's running
sudo systemctl stop nginx

# Get SSL certificate from Let's Encrypt
sudo certbot certonly --standalone -d hr.agrsmv.ru

# Start nginx
sudo systemctl start nginx
```

### Step 3: Configure Nginx
```bash
# Copy the SSL configuration
sudo cp nginx-ssl-config.conf /etc/nginx/sites-available/hr.agrsmv.ru

# Enable the site
sudo ln -s /etc/nginx/sites-available/hr.agrsmv.ru /etc/nginx/sites-enabled/

# Remove default site
sudo rm -f /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

### Step 4: Update Docker Configuration
```bash
# Edit your .env file to use port 8080 for Docker
echo "FRONTEND_PORT=8080" >> .env

# Restart containers
docker-compose down
docker-compose up -d
```

### Step 5: Update Nginx Config for New Port
Edit `/etc/nginx/sites-available/hr.agrsmv.ru` and change:
```nginx
# Change this line:
proxy_pass http://localhost:443;
# To:
proxy_pass http://localhost:8080;
```

Then reload nginx:
```bash
sudo systemctl reload nginx
```

## Solution 2: Use Cloudflare (Easier)

### Step 1: Set up Cloudflare
1. Add your domain `agrsmv.ru` to Cloudflare
2. Update your domain's nameservers to Cloudflare's
3. Enable SSL/TLS in Cloudflare dashboard (Full or Full Strict)

### Step 2: Update Your Configuration
```bash
# Update .env file
echo "APP_PROTOCOL=https" >> .env
echo "FRONTEND_PORT=8080" >> .env
echo "CORS_ORIGIN_PROD=https://hr.agrsmv.ru" >> .env

# Restart containers
docker-compose down
docker-compose up -d
```

### Step 3: Configure Cloudflare
- Set up a CNAME record: `hr` pointing to `agrsmv.ru`
- Or A record: `hr` pointing to `45.12.74.41`
- Enable "Always Use HTTPS" in SSL/TLS settings

## Solution 3: Simple Port Change (Quick Fix)

If you want to keep it simple for now:

### Step 1: Change Docker Port
```bash
# Edit .env file
echo "FRONTEND_PORT=80" >> .env

# Restart containers
docker-compose down
docker-compose up -d
```

### Step 2: Access via HTTP
Use: `http://hr.agrsmv.ru` (without port number)

## Testing Your Setup

After implementing any solution:

```bash
# Test HTTP redirect (if using nginx)
curl -I http://hr.agrsmv.ru

# Test HTTPS access
curl -I https://hr.agrsmv.ru

# Test API access
curl -I https://hr.agrsmv.ru/api/health
```

## Current Status Check

Your containers are running correctly:
- ✅ Frontend: Healthy on port 443
- ✅ Backend: Healthy on port 3000  
- ✅ Bot: Healthy
- ✅ Database: Healthy

The only issue is the SSL/HTTPS configuration for proper domain access.

## Recommended Next Steps

1. **For Production**: Use Solution 1 (Nginx + Let's Encrypt)
2. **For Quick Setup**: Use Solution 2 (Cloudflare)
3. **For Testing**: Use Solution 3 (HTTP on port 80)

Choose the solution that best fits your needs and infrastructure setup.
