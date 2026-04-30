#!/bin/bash

# GitHub Actions Setup Script for GCP Deployment
# This script helps you set up automated deployment

set -e

echo "=========================================="
echo "GitHub Actions Setup for GCP Deployment"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Generate SSH Key
echo -e "${GREEN}Step 1: Generate SSH Key${NC}"
echo "Generating SSH key pair for GitHub Actions..."

SSH_KEY_PATH="$HOME/.ssh/github-actions-gcp"

if [ -f "$SSH_KEY_PATH" ]; then
    echo -e "${YELLOW}SSH key already exists at $SSH_KEY_PATH${NC}"
    read -p "Do you want to overwrite it? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Using existing key..."
    else
        ssh-keygen -t ed25519 -C "github-actions" -f "$SSH_KEY_PATH" -N ""
        echo -e "${GREEN}✓ New SSH key generated${NC}"
    fi
else
    ssh-keygen -t ed25519 -C "github-actions" -f "$SSH_KEY_PATH" -N ""
    echo -e "${GREEN}✓ SSH key generated${NC}"
fi

echo ""

# Step 2: Display Public Key
echo -e "${GREEN}Step 2: Public Key${NC}"
echo "Copy this public key and add it to your GCP VM:"
echo ""
echo -e "${YELLOW}$(cat ${SSH_KEY_PATH}.pub)${NC}"
echo ""
read -p "Press Enter after you've added the public key to your GCP VM..."

# Step 3: Get GCP Details
echo ""
echo -e "${GREEN}Step 3: GCP VM Details${NC}"
read -p "Enter your GCP VM username (e.g., kit27_ad11): " GCP_USER
read -p "Enter your GCP VM IP or domain (e.g., 34.83.xxx.xxx or dhans.online): " GCP_HOST
read -p "Enter your application directory on GCP (e.g., /home/kit27_ad11/callrem): " APP_DIR

# Step 4: Test SSH Connection
echo ""
echo -e "${GREEN}Step 4: Testing SSH Connection${NC}"
echo "Testing connection to $GCP_USER@$GCP_HOST..."

if ssh -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no "$GCP_USER@$GCP_HOST" "echo 'Connection successful!'" 2>/dev/null; then
    echo -e "${GREEN}✓ SSH connection successful!${NC}"
else
    echo -e "${RED}✗ SSH connection failed!${NC}"
    echo "Please ensure:"
    echo "1. Public key is added to ~/.ssh/authorized_keys on GCP VM"
    echo "2. GCP VM is accessible"
    echo "3. Username and host are correct"
    exit 1
fi

# Step 5: Display Private Key
echo ""
echo -e "${GREEN}Step 5: GitHub Secrets${NC}"
echo "Add these secrets to your GitHub repository:"
echo ""
echo -e "${YELLOW}Settings → Secrets and variables → Actions → New repository secret${NC}"
echo ""

echo "1. GCP_SSH_PRIVATE_KEY"
echo "   Copy the entire content below (including BEGIN and END lines):"
echo ""
echo "---BEGIN PRIVATE KEY---"
cat "$SSH_KEY_PATH"
echo "---END PRIVATE KEY---"
echo ""
read -p "Press Enter after you've added GCP_SSH_PRIVATE_KEY to GitHub..."

echo ""
echo "2. GCP_USER"
echo "   Value: $GCP_USER"
echo ""
read -p "Press Enter after you've added GCP_USER to GitHub..."

echo ""
echo "3. GCP_HOST"
echo "   Value: $GCP_HOST"
echo ""
read -p "Press Enter after you've added GCP_HOST to GitHub..."

echo ""
echo "4. APP_DIR"
echo "   Value: $APP_DIR"
echo ""
read -p "Press Enter after you've added APP_DIR to GitHub..."

# Step 6: Summary
echo ""
echo -e "${GREEN}=========================================="
echo "✓ Setup Complete!"
echo "==========================================${NC}"
echo ""
echo "Summary:"
echo "--------"
echo "SSH Key: $SSH_KEY_PATH"
echo "GCP User: $GCP_USER"
echo "GCP Host: $GCP_HOST"
echo "App Directory: $APP_DIR"
echo ""
echo "Next Steps:"
echo "1. Commit and push the workflow file:"
echo "   git add .github/workflows/deploy-gcp.yml"
echo "   git commit -m 'ci: add GitHub Actions deployment workflow'"
echo "   git push origin main"
echo ""
echo "2. Monitor deployment:"
echo "   Go to GitHub → Actions tab"
echo ""
echo "3. Test manual deployment:"
echo "   Actions → Deploy to GCP → Run workflow"
echo ""
echo -e "${GREEN}Happy deploying!${NC}"
