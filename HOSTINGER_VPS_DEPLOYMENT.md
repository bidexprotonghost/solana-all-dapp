# 🚀 Hostinger VPS Deployment Guide - Solana Admin dApp v1.0.0

**Deploy your Solana Admin dApp on Hostinger VPS in 10 minutes**

---

## 📋 Prerequisites

- ✅ Hostinger VPS account with SSH access
- ✅ Node.js 18+ (or will install)
- ✅ Git installed (or will install)
- ✅ GitHub repository (optional but recommended)

---

## 🎯 Deployment Options

### **Option 1: Direct Node.js (Simplest - 5 min)**
### **Option 2: Docker (Recommended - 10 min)**
### **Option 3: PM2 + Nginx (Production - 15 min)**

---

## ⚡ OPTION 1: Direct Node.js (Quickest)

### Step 1: SSH into Hostinger VPS

```bash
ssh user@your-vps-ip
# Enter password when prompted
```

### Step 2: Clone the Repository

```bash
cd /home/user/public_html  # or your preferred directory

# Option A: If pushed to GitHub
git clone https://github.com/bidexprotonghost/solana-all-dapp.git
cd solana-all-dapp

# Option B: If uploading files directly
# Upload the my-project folder via SFTP/File Manager
```

### Step 3: Install Dependencies

```bash
cd app  # Enter the app directory

npm install
```

### Step 4: Create Environment File

```bash
cat > .env.local << 'EOF'
NEXT_PUBLIC_SOLANA_RPC=https://api.devnet.solana.com
NEXT_PUBLIC_ADMIN_PUBLIC_KEY=your-admin-wallet-address
INTERACTION_WALLET_PRIVATE_KEY=base64-encoded-keypair
EOF
```

### Step 5: Build & Run

```bash
npm run build

# Start the app
npm start
```

✅ **App is live at**: `http://your-vps-ip:3000`

---

## 🐳 OPTION 2: Docker Deployment (Recommended)

### Step 1: SSH into VPS

```bash
ssh user@your-vps-ip
```

### Step 2: Install Docker

```bash
sudo apt-get update
sudo apt-get install -y docker.io docker-compose

# Add user to docker group
sudo usermod -aG docker $USER
exit  # Re-login for changes to take effect
```

### Step 3: Clone Repository

```bash
cd /home/user
git clone https://github.com/bidexprotonghost/solana-all-dapp.git
cd solana-all-dapp
```

### Step 4: Build Docker Image

```bash
docker build -t solana-admin-dapp:1.0.0 .
```

### Step 5: Create Environment File

```bash
cat > .env.docker << 'EOF'
NEXT_PUBLIC_SOLANA_RPC=https://api.devnet.solana.com
NEXT_PUBLIC_ADMIN_PUBLIC_KEY=your-admin-wallet-address
INTERACTION_WALLET_PRIVATE_KEY=base64-encoded-keypair
EOF
```

### Step 6: Run Container

```bash
docker run -d \
  --name solana-app \
  --restart always \
  -p 3000:3000 \
  --env-file .env.docker \
  solana-admin-dapp:1.0.0
```

### Step 7: Verify Container is Running

```bash
docker ps
# Should see: solana-app with status 'Up'

# View logs
docker logs solana-app
```

✅ **App is live at**: `http://your-vps-ip:3000`

---

## 🎛️ OPTION 3: PM2 + Nginx (Production-Grade)

### Step 1-3: Follow Docker Steps 1-3 (Clone Repo)

```bash
ssh user@your-vps-ip
cd /home/user
git clone https://github.com/bidexprotonghost/solana-all-dapp.git
cd solana-all-dapp/app
```

### Step 4: Install PM2 Globally

```bash
sudo npm install -g pm2
npm install
```

### Step 5: Build Application

```bash
npm run build
```

### Step 6: Create Ecosystem Config

```bash
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'solana-admin-dapp',
    script: '/home/user/.nvm/versions/node/v18.x.x/bin/node',
    args: '/home/user/.nvm/versions/node/v18.x.x/bin/next start',
    cwd: '/home/user/solana-all-dapp/app',
    env: {
      NEXT_PUBLIC_SOLANA_RPC: 'https://api.devnet.solana.com',
      NEXT_PUBLIC_ADMIN_PUBLIC_KEY: 'your-admin-wallet-address',
      INTERACTION_WALLET_PRIVATE_KEY: 'base64-encoded-keypair'
    },
    instances: 'max',
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
  }]
};
EOF
```

### Step 7: Start with PM2

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# View logs
pm2 logs solana-admin-dapp
```

### Step 8: Install & Configure Nginx

```bash
sudo apt-get install -y nginx

sudo nano /etc/nginx/sites-available/solana-app
```

**Paste this config:**

```nginx
upstream solana_backend {
    server localhost:3000;
    keepalive 64;
}

server {
    listen 80;
    server_name your-domain.com;

    client_max_body_size 20M;

    location / {
        proxy_pass http://solana_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Step 9: Enable Nginx Site

```bash
sudo ln -s /etc/nginx/sites-available/solana-app /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default  # Remove default site

# Test config
sudo nginx -t

# Start nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### Step 10: Setup SSL (Optional but Recommended)

```bash
sudo apt-get install -y certbot python3-certbot-nginx

sudo certbot --nginx -d your-domain.com

# Auto-renew
sudo systemctl enable certbot.timer
```

✅ **App is live at**: `http://your-domain.com` or `https://your-domain.com`

---

## 🔧 Environment Variables Explained

### `NEXT_PUBLIC_SOLANA_RPC`
**Solana RPC Endpoint** - Network to connect to
- Devnet: `https://api.devnet.solana.com`
- Mainnet: `https://api.mainnet-beta.solana.com`

### `NEXT_PUBLIC_ADMIN_PUBLIC_KEY`
**Your Admin Wallet Address**
- Find in Phantom wallet → Public Key
- Format: Base58 string like `7x8...kL9`

### `INTERACTION_WALLET_PRIVATE_KEY`
**Interaction Wallet Private Key (Base64)**
- Generate from Solana CLI or Phantom export
- Keep it server-side; it is never a `NEXT_PUBLIC_*` variable
- Example: `aW1wb3J0c2VjcmV0a2V5aGVyZWJhc2U2NGVuY29kZWQ=`

**⚠️ SECURITY**: Never commit `.env` files to Git!

---

## 📊 Monitoring & Maintenance

### Docker - Check Container Status

```bash
# View running containers
docker ps

# View logs
docker logs -f solana-app

# Stop container
docker stop solana-app

# Remove and redeploy
docker rm solana-app
docker run -d --name solana-app ... [repeat run command]
```

### PM2 - Monitor Processes

```bash
# View all processes
pm2 list

# View logs
pm2 logs solana-admin-dapp

# Restart app
pm2 restart solana-admin-dapp

# Stop app
pm2 stop solana-admin-dapp

# Start app
pm2 start solana-admin-dapp
```

### Nginx - Check Web Server

```bash
# Test config
sudo nginx -t

# View status
sudo systemctl status nginx

# View error logs
sudo tail -f /var/log/nginx/error.log

# View access logs
sudo tail -f /var/log/nginx/access.log
```

---

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Find what's using port 3000
sudo lsof -i :3000

# Kill process
sudo kill -9 <PID>
```

### Permission Denied Errors

```bash
# For Docker
sudo chmod 666 /var/run/docker.sock

# For file permissions
sudo chown -R $USER:$USER /home/user/solana-all-dapp
```

### npm install Fails

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

### Build Errors

```bash
# Check Node version (should be 18+)
node --version

# Clear Next.js cache
rm -rf .next

# Rebuild
npm run build
```

### App Not Responding

```bash
# Check if port 3000 is listening
sudo netstat -tlnp | grep 3000

# Check disk space
df -h

# Check memory
free -h

# Check CPU usage
top
```

---

## 🎉 Deployment Complete!

Your Solana Admin dApp is now live on Hostinger VPS! 🎉

### Next Steps:

1. **Test the Application**
   - Go to `http://your-vps-ip:3000` or `https://your-domain.com`
   - Connect your wallet (Phantom/Solflare)
   - Test admin features

2. **Setup Monitoring** (Optional)
   ```bash
   pm2 install pm2-auto-pull
   pm2 install pm2-logrotate
   ```

3. **Setup Backups**
   - Backup `/home/user/solana-all-dapp` regularly
   - Export database if you add one later

4. **Enable Firewall** (Security)
   ```bash
   sudo ufw enable
   sudo ufw allow 22   # SSH
   sudo ufw allow 80   # HTTP
   sudo ufw allow 443  # HTTPS
   ```

---

## 📞 Support & Documentation

- **Solana Docs**: https://docs.solana.com
- **Next.js Docs**: https://nextjs.org/docs
- **Hostinger Help**: Your VPS Dashboard → Support
- **Docker Docs**: https://docs.docker.com

---

## 📝 Quick Command Reference

```bash
# SSH into VPS
ssh user@your-vps-ip

# Navigate to app
cd /home/user/solana-all-dapp/app

# View logs (PM2)
pm2 logs solana-admin-dapp

# Restart app (PM2)
pm2 restart solana-admin-dapp

# View Docker logs
docker logs -f solana-app

# View Nginx logs
sudo tail -f /var/log/nginx/error.log
```

---

**Happy Deploying! 🚀**

Version: 1.0.0  
Last Updated: 2026-08-16  
Status: Production Ready
