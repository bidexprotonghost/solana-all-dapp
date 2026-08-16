#!/bin/bash
# QUICK PUBLICATION COMMANDS
# Copy and run these commands to publish your Solana Admin dApp

echo "🚀 Solana Admin dApp v1.0.0 - Publication Quick Start"
echo "===================================================="
echo ""

# OPTION 1: GITHUB PUBLICATION (Recommended)
echo "📦 OPTION 1: Publish to GitHub"
echo "-------------------------------"
echo ""
echo "Step 1: Create a repository on GitHub at https://github.com/new"
echo "        Name it: solana-admin-dapp"
echo ""
echo "Step 2: Run these commands:"
echo ""
cat << 'EOF'
cd /workspaces/codespaces-blank/my-project

# Configure git
git config user.email "your-email@example.com"
git config user.name "Your Name"

# Add GitHub remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/solana-admin-dapp.git

# Push to GitHub
git branch -M main
git push -u origin main
git push origin v1.0.0

echo "✅ Published to GitHub!"
EOF

echo ""
echo "Step 3: Create GitHub Release"
echo "     Visit: https://github.com/YOUR_USERNAME/solana-admin-dapp/releases"
echo "     Click 'Create a new release'"
echo "     Select tag: v1.0.0"
echo ""
echo ""

# OPTION 2: VERCEL DEPLOYMENT
echo "🌐 OPTION 2: Deploy to Vercel (Recommended)"
echo "--------------------------------------------"
echo ""
echo "Step 1: Go to https://vercel.com/signup (sign up with GitHub)"
echo ""
echo "Step 2: Click 'Add New' → 'Project'"
echo "        Select your GitHub repository"
echo ""
echo "Step 3: Configure:"
echo "        Framework: Next.js"
echo "        Root Directory: app"
echo ""
echo "Step 4: Add Environment Variables:"
echo "        NEXT_PUBLIC_SOLANA_RPC=https://api.devnet.solana.com"
echo "        NEXT_PUBLIC_ADMIN_PUBLIC_KEY=<your-wallet>"
echo "        NEXT_PUBLIC_INTERACTION_WALLET_PRIVATE_KEY=<base64-key>"
echo ""
echo "Step 5: Click 'Deploy' ✅"
echo ""
echo ""

# OPTION 3: DOCKER
echo "🐳 OPTION 3: Docker Deployment"
echo "-------------------------------"
echo ""
cat << 'EOF'
cd /workspaces/codespaces-blank/my-project

# Build Docker image
docker build -t solana-admin-dapp:1.0.0 .

# Run container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SOLANA_RPC="https://api.devnet.solana.com" \
  -e NEXT_PUBLIC_ADMIN_PUBLIC_KEY="<wallet>" \
  -e NEXT_PUBLIC_INTERACTION_WALLET_PRIVATE_KEY="<key>" \
  solana-admin-dapp:1.0.0

echo "✅ Running on http://localhost:3000"
EOF

echo ""
echo ""
echo "📚 Full documentation:"
echo "   See PUBLICATION_GUIDE.md for detailed instructions"
echo ""
echo "✨ Status: READY FOR PUBLICATION"
echo ""
