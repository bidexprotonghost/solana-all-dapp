#!/bin/bash

################################################################################
#                                                                              #
#              🚀 SOLANA ADMIN dAPP - VPS DEPLOYMENT SCRIPT                   #
#                  Complete One-Command Deployment                            #
#                                                                              #
################################################################################

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REPO_URL="https://github.com/bidexprotonghost/solana-all-dapp.git"
APP_NAME="solana-admin-dapp"
APP_DIR="/root/${APP_NAME}"
PORT="3000"
RPC_URL="${NEXT_PUBLIC_SOLANA_RPC:-https://api.devnet.solana.com}"
ADMIN_PUBLIC_KEY="${NEXT_PUBLIC_ADMIN_PUBLIC_KEY:-}"
INTERACTION_WALLET_PRIVATE_KEY="${NEXT_PUBLIC_INTERACTION_WALLET_PRIVATE_KEY:-}"

# Colors for messages
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}       🚀 SOLANA ADMIN dAPP - VPS DEPLOYMENT                    ${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# Step 1: Update system
echo -e "${YELLOW}[1/8] Updating system packages...${NC}"
apt-get update -qq && apt-get upgrade -y -qq
echo -e "${GREEN}✅ System updated${NC}"
echo ""

# Step 2: Install Node.js if not installed
echo -e "${YELLOW}[2/8] Checking Node.js installation...${NC}"
if ! command -v node &> /dev/null; then
    echo "Installing Node.js 18..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash - 2>&1 | grep -E "(installing|Adding|Setting)"
    apt-get install -y nodejs -qq
fi
NODE_VERSION=$(node --version)
echo -e "${GREEN}✅ Node.js ${NODE_VERSION} ready${NC}"
echo ""

# Step 3: Install Git if not installed
echo -e "${YELLOW}[3/8] Checking Git installation...${NC}"
if ! command -v git &> /dev/null; then
    apt-get install -y git -qq
fi
echo -e "${GREEN}✅ Git ready${NC}"
echo ""

# Step 4: Clone or pull repository
echo -e "${YELLOW}[4/8] Cloning repository...${NC}"
if [ -d "$APP_DIR" ]; then
    echo "Repository already exists, pulling latest changes..."
    cd "$APP_DIR"
    git pull origin main
else
    git clone "$REPO_URL" "$APP_DIR"
    cd "$APP_DIR"
fi
echo -e "${GREEN}✅ Repository ready${NC}"
echo ""

# Step 5: Install dependencies
echo -e "${YELLOW}[5/8] Installing npm dependencies...${NC}"
cd "$APP_DIR/app"
npm ci 2>&1 | tail -5
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Step 6: Create environment file
echo -e "${YELLOW}[6/8] Creating environment configuration...${NC}"
if [ -z "$ADMIN_PUBLIC_KEY" ]; then
    read -r -p "Enter NEXT_PUBLIC_ADMIN_PUBLIC_KEY: " ADMIN_PUBLIC_KEY
fi
if [ -z "$INTERACTION_WALLET_PRIVATE_KEY" ]; then
    read -r -s -p "Enter NEXT_PUBLIC_INTERACTION_WALLET_PRIVATE_KEY (base64): " INTERACTION_WALLET_PRIVATE_KEY
    echo ""
fi
cat > ".env.local" << EOF
NEXT_PUBLIC_SOLANA_RPC=${RPC_URL}
NEXT_PUBLIC_ADMIN_PUBLIC_KEY=${ADMIN_PUBLIC_KEY}
NEXT_PUBLIC_INTERACTION_WALLET_PRIVATE_KEY=${INTERACTION_WALLET_PRIVATE_KEY}
EOF
echo -e "${GREEN}✅ Environment configured${NC}"
echo ""

# Step 7: Build application
echo -e "${YELLOW}[7/8] Building Next.js application...${NC}"
npm run build 2>&1 | tail -3
echo -e "${GREEN}✅ Application built${NC}"
echo ""

# Step 8: Install PM2 and start application
echo -e "${YELLOW}[8/8] Setting up PM2 process manager...${NC}"
npm install -g pm2 -qq

# Create ecosystem config
cat > "ecosystem.config.js" << EOF
module.exports = {
  apps: [{
    name: 'solana-admin-dapp',
    script: 'node_modules/.bin/next',
    args: 'start',
    cwd: '/root/solana-admin-dapp/app',
    env: {
      NEXT_PUBLIC_SOLANA_RPC: '${RPC_URL}',
      NEXT_PUBLIC_ADMIN_PUBLIC_KEY: '${ADMIN_PUBLIC_KEY}',
      NEXT_PUBLIC_INTERACTION_WALLET_PRIVATE_KEY: '${INTERACTION_WALLET_PRIVATE_KEY}'
    },
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    error_file: '/var/log/pm2/error.log',
    out_file: '/var/log/pm2/out.log',
    log_file: '/var/log/pm2/combined.log'
  }]
};
EOF

# Stop any existing instance
pm2 stop solana-admin-dapp 2>/dev/null
pm2 delete solana-admin-dapp 2>/dev/null

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup -u root --hp /root 2>&1 | tail -1

echo -e "${GREEN}✅ PM2 configured and app started${NC}"
echo ""

################################################################################
#                         DEPLOYMENT COMPLETE                                 #
################################################################################

echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}              ✅ DEPLOYMENT SUCCESSFUL!                        ${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}📊 APPLICATION STATUS:${NC}"
pm2 list
echo ""
echo -e "${BLUE}🌐 ACCESS YOUR APP:${NC}"
echo -e "   HTTP:  ${GREEN}http://2.25.91.253:3000${NC}"
echo ""
echo -e "${BLUE}📝 USEFUL COMMANDS:${NC}"
echo -e "   View logs:    ${YELLOW}pm2 logs solana-admin-dapp${NC}"
echo -e "   Restart:      ${YELLOW}pm2 restart solana-admin-dapp${NC}"
echo -e "   Stop:         ${YELLOW}pm2 stop solana-admin-dapp${NC}"
echo -e "   Status:       ${YELLOW}pm2 status${NC}"
echo ""
echo -e "${BLUE}🔒 NEXT STEPS:${NC}"
echo -e "   1. Test the app: http://2.25.91.253:3000"
echo -e "   2. Connect your Phantom wallet"
echo -e "   3. Test admin features"
echo -e ""
echo -e "${BLUE}📚 DOCUMENTATION:${NC}"
echo -e "   Full guide: ${APP_DIR}/HOSTINGER_VPS_DEPLOYMENT.md"
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
