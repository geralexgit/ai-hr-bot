# Custom Domain Setup Guide

This guide explains how to configure the AI HR Bot to be accessible on your custom domain or IP address.

## Quick Setup

1. **Copy the Docker environment template:**
   ```bash
   cp env.docker .env
   ```

2. **Edit the `.env` file and update these key variables:**
   ```bash
   # Your domain or IP address
   APP_DOMAIN=your-domain.com
   
   # Protocol (http for development, https for production)
   APP_PROTOCOL=https
   
   # Your Telegram bot token (required)
   TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
   
   # Port configuration (optional)
   FRONTEND_PORT=80      # Frontend will be accessible on this port
   API_PORT=3000         # API will be accessible on this port
   ```

3. **Start the services:**
   ```bash
   ./docker-start.sh
   ```

## Examples

### Local Development
```env
APP_DOMAIN=localhost
APP_PROTOCOL=http
FRONTEND_PORT=80
```
**Access**: http://localhost

### Production with Custom Domain
```env
APP_DOMAIN=hr-bot.mycompany.com
APP_PROTOCOL=https
FRONTEND_PORT=443
```
**Access**: https://hr-bot.mycompany.com

### Server IP Address
```env
APP_DOMAIN=192.168.1.100
APP_PROTOCOL=http
FRONTEND_PORT=80
```
**Access**: http://192.168.1.100

## What Gets Configured Automatically

When you set `APP_DOMAIN` and `APP_PROTOCOL`, the system automatically configures:

1. **CORS Origins**: Allows frontend to communicate with backend
2. **API Base URL**: Frontend knows where to find the API
3. **Nginx Server**: Accepts requests for your domain
4. **Service URLs**: All internal references use your domain

## Port Configuration

- **FRONTEND_PORT**: Port where the admin panel will be accessible (default: 80)
- **API_PORT**: Port where the API server runs (default: 3000)

## SSL/HTTPS Setup

For production HTTPS setup:

1. Set `APP_PROTOCOL=https` in your `.env` file
2. Set `FRONTEND_PORT=443` (standard HTTPS port)
3. Configure SSL certificates in your reverse proxy (nginx, Apache, etc.)
4. Or use a service like Cloudflare for SSL termination

## Troubleshooting

### CORS Errors
If you see CORS errors in the browser console:
1. Make sure `APP_DOMAIN` matches exactly what you're using in the browser
2. Check that `APP_PROTOCOL` is correct (http vs https)
3. Restart the Docker containers after changing `.env`

### Can't Access the Application
1. Check that the ports are not blocked by firewall
2. Verify Docker containers are running: `docker-compose ps`
3. Check container logs: `docker-compose logs frontend backend`

### API Not Found
1. Ensure `API_PORT` is accessible from your network
2. Check that the backend container is healthy: `docker-compose ps`
3. Test API directly: `curl http://your-domain:3000/health`

## Advanced Configuration

For advanced setups with reverse proxies, load balancers, or complex networking, you may need to:

1. Manually set `CORS_ORIGIN_PROD` in your `.env` file
2. Configure additional nginx settings in `admin-panel/nginx.conf`
3. Adjust Docker networking in `docker-compose.yml`

## Getting Help

If you need help with the setup:
1. Check the logs: `./docker-start.sh logs`
2. Verify your configuration: `./docker-start.sh status`
3. Review the main [README.md](./README.md) for additional configuration options
