# GitHub Actions Setup Guide

This guide explains how to set up automated deployment to GCP using GitHub Actions.

## Overview

The GitHub Actions workflow automatically deploys your application to GCP VM whenever you push code to the `main` branch.

## Prerequisites

- GitHub repository with your code
- GCP VM instance running and configured
- SSH access to your GCP VM
- Application already deployed manually at least once

## Setup Steps

### Step 1: Generate SSH Key for GitHub Actions

On your local machine, generate a new SSH key pair:

```bash
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github-actions-gcp
```

This creates two files:
- `~/.ssh/github-actions-gcp` (private key)
- `~/.ssh/github-actions-gcp.pub` (public key)

### Step 2: Add Public Key to GCP VM

Copy the public key to your GCP VM:

```bash
# Display public key
cat ~/.ssh/github-actions-gcp.pub

# Copy the output
```

Then on your GCP VM:

```bash
# SSH into your GCP VM
ssh your-username@your-gcp-ip

# Add the public key to authorized_keys
echo "YOUR_PUBLIC_KEY_HERE" >> ~/.ssh/authorized_keys

# Set correct permissions
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
```

### Step 3: Configure GitHub Secrets

Go to your GitHub repository:

1. Click **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add the following secrets:

#### GCP_SSH_PRIVATE_KEY
- Name: `GCP_SSH_PRIVATE_KEY`
- Value: Content of `~/.ssh/github-actions-gcp` (private key)

```bash
# Display private key
cat ~/.ssh/github-actions-gcp
# Copy entire content including BEGIN and END lines
```

#### GCP_USER
- Name: `GCP_USER`
- Value: Your GCP VM username (e.g., `kit27_ad11`)

#### GCP_HOST
- Name: `GCP_HOST`
- Value: Your GCP VM external IP or domain (e.g., `34.83.xxx.xxx` or `dhans.online`)

#### APP_DIR
- Name: `APP_DIR`
- Value: Path to your application on GCP VM (e.g., `/home/kit27_ad11/callrem`)

### Step 4: Verify Workflow File

The workflow file is located at `.github/workflows/deploy-gcp.yml`

It will:
1. Checkout code from GitHub
2. Setup SSH connection to GCP
3. Pull latest changes on GCP VM
4. Install dependencies
5. Build application
6. Restart with PM2
7. Verify deployment

### Step 5: Test the Workflow

#### Option 1: Push to Main Branch

```bash
git add .
git commit -m "test: trigger deployment"
git push origin main
```

#### Option 2: Manual Trigger

1. Go to GitHub repository
2. Click **Actions** tab
3. Select **Deploy to GCP** workflow
4. Click **Run workflow**
5. Select branch and click **Run workflow**

### Step 6: Monitor Deployment

1. Go to **Actions** tab in GitHub
2. Click on the running workflow
3. Watch the deployment progress in real-time
4. Check for any errors

## Workflow Triggers

The workflow runs automatically on:
- Push to `main` branch
- Manual trigger via GitHub UI

To change triggers, edit `.github/workflows/deploy-gcp.yml`:

```yaml
on:
  push:
    branches:
      - main        # Deploy on push to main
      - develop     # Add more branches
  pull_request:     # Deploy on PR
    branches:
      - main
  workflow_dispatch: # Manual trigger
```

## Troubleshooting

### SSH Connection Failed

**Error:** `Permission denied (publickey)`

**Solution:**
1. Verify public key is in `~/.ssh/authorized_keys` on GCP VM
2. Check private key is correctly added to GitHub secrets
3. Ensure key format is correct (include BEGIN/END lines)

```bash
# Test SSH connection locally
ssh -i ~/.ssh/github-actions-gcp your-username@your-gcp-ip
```

### Git Pull Failed

**Error:** `fatal: could not read Username`

**Solution:**
Ensure your repository is public or configure SSH for git:

```bash
# On GCP VM, change remote URL to SSH
cd ~/callrem
git remote set-url origin git@github.com:username/repo.git
```

### Build Failed

**Error:** `npm run build` fails

**Solution:**
1. Check Node.js version on GCP VM
2. Verify all dependencies are in `package.json`
3. Check build logs for specific errors

### PM2 Restart Failed

**Error:** `pm2 restart` fails

**Solution:**
```bash
# On GCP VM, check PM2 status
pm2 status

# If app doesn't exist, start it
pm2 start npm --name student-call-assist -- start
pm2 save
```

## Advanced Configuration

### Deploy to Multiple Environments

Create separate workflow files for different environments:

```
.github/workflows/
├── deploy-production.yml
├── deploy-staging.yml
└── deploy-development.yml
```

### Add Slack Notifications

Add to workflow:

```yaml
- name: Notify Slack
  if: always()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### Run Tests Before Deploy

Add before deployment step:

```yaml
- name: Run tests
  run: |
    npm install
    npm test
```

### Database Migrations

Add after pulling code:

```yaml
- name: Run database migrations
  run: |
    ssh $GCP_USER@$GCP_HOST << 'ENDSSH'
      cd ${{ secrets.APP_DIR }}
      npm run db:push
    ENDSSH
```

### Rollback on Failure

Add rollback step:

```yaml
- name: Rollback on failure
  if: failure()
  run: |
    ssh $GCP_USER@$GCP_HOST << 'ENDSSH'
      cd ${{ secrets.APP_DIR }}
      git reset --hard HEAD~1
      npm install
      npm run build
      pm2 restart student-call-assist
    ENDSSH
```

## Security Best Practices

1. **Never commit secrets** to repository
2. **Use GitHub Secrets** for all sensitive data
3. **Rotate SSH keys** regularly
4. **Limit SSH key permissions** (use dedicated key for CI/CD)
5. **Enable branch protection** on main branch
6. **Require PR reviews** before merging
7. **Use environment-specific secrets** for staging/production

## Monitoring

### View Deployment History

1. Go to **Actions** tab
2. View all workflow runs
3. Click on any run to see details

### Check Application Logs

After deployment, check logs on GCP VM:

```bash
ssh your-username@your-gcp-ip
pm2 logs student-call-assist
```

### Set Up Alerts

Configure GitHub to send notifications:

1. Repository **Settings** → **Notifications**
2. Enable email notifications for workflow failures
3. Or use Slack/Discord webhooks

## Workflow Status Badge

Add to your README.md:

```markdown
![Deploy to GCP](https://github.com/username/repo/actions/workflows/deploy-gcp.yml/badge.svg)
```

## Cost Considerations

GitHub Actions is free for public repositories with:
- 2,000 minutes/month for private repos
- Unlimited minutes for public repos

This workflow typically uses:
- 2-5 minutes per deployment
- ~60-150 minutes/month (assuming 30 deployments)

## Next Steps

After successful setup:

1. Test deployment with a small change
2. Monitor first few deployments
3. Set up branch protection rules
4. Configure additional environments (staging, etc.)
5. Add automated tests to workflow
6. Set up monitoring and alerts

## Support

If you encounter issues:

1. Check workflow logs in GitHub Actions
2. Verify all secrets are correctly set
3. Test SSH connection manually
4. Review GCP VM logs
5. Check application logs with PM2

## Example Deployment Flow

```
Developer pushes code
        ↓
GitHub Actions triggered
        ↓
Checkout code
        ↓
Setup SSH connection
        ↓
Connect to GCP VM
        ↓
Pull latest code
        ↓
Install dependencies
        ↓
Build application
        ↓
Restart with PM2
        ↓
Verify deployment
        ↓
Notify status
```

## Conclusion

Your automated deployment is now configured! Every push to main will automatically deploy to your GCP VM.

**Happy deploying!**
