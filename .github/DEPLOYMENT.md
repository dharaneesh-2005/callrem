# Automated Deployment Guide

Quick reference for GitHub Actions automated deployment to GCP.

## Quick Setup

Run the setup script:

```bash
bash setup-github-actions.sh
```

Follow the prompts to configure everything automatically.

## Manual Setup

### 1. Generate SSH Key

```bash
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github-actions-gcp
```

### 2. Add Public Key to GCP

```bash
# Copy public key
cat ~/.ssh/github-actions-gcp.pub

# On GCP VM
echo "YOUR_PUBLIC_KEY" >> ~/.ssh/authorized_keys
```

### 3. Add GitHub Secrets

Go to: **Settings → Secrets and variables → Actions**

Add these secrets:
- `GCP_SSH_PRIVATE_KEY` - Content of `~/.ssh/github-actions-gcp`
- `GCP_USER` - Your GCP username (e.g., `kit27_ad11`)
- `GCP_HOST` - Your GCP IP or domain (e.g., `dhans.online`)
- `APP_DIR` - App path on GCP (e.g., `/home/kit27_ad11/callrem`)

### 4. Push Workflow

```bash
git add .github/workflows/deploy-gcp.yml
git commit -m "ci: add deployment workflow"
git push origin main
```

## How It Works

Every push to `main` branch:
1. Checks out code
2. Connects to GCP VM via SSH
3. Pulls latest changes
4. Installs dependencies
5. Builds application
6. Restarts with PM2
7. Verifies deployment

## Manual Trigger

1. Go to **Actions** tab
2. Select **Deploy to GCP**
3. Click **Run workflow**
4. Select branch
5. Click **Run workflow**

## Monitor Deployment

View real-time logs:
1. Go to **Actions** tab
2. Click on running workflow
3. Watch deployment progress

## Troubleshooting

### SSH Connection Failed
- Verify public key is on GCP VM
- Check private key in GitHub secrets
- Test: `ssh -i ~/.ssh/github-actions-gcp user@host`

### Build Failed
- Check Node.js version on GCP
- Verify dependencies in package.json
- Review build logs

### PM2 Restart Failed
- Check PM2 status on GCP: `pm2 status`
- Restart manually: `pm2 restart student-call-assist`

## Deployment Status

Add badge to README:

```markdown
![Deploy](https://github.com/username/repo/actions/workflows/deploy-gcp.yml/badge.svg)
```

## Security

- Never commit SSH keys
- Use GitHub Secrets for sensitive data
- Rotate keys regularly
- Enable branch protection
- Require PR reviews

## Support

- Check workflow logs in Actions tab
- Review GCP VM logs: `pm2 logs student-call-assist`
- Test SSH manually
- Verify all secrets are set

---

For detailed documentation, see [GITHUB_ACTIONS_SETUP.md](../GITHUB_ACTIONS_SETUP.md)
