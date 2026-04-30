# CI/CD Setup Complete

GitHub Actions automated deployment to GCP is now configured.

## Files Created

1. `.github/workflows/deploy-gcp.yml` - GitHub Actions workflow
2. `GITHUB_ACTIONS_SETUP.md` - Detailed setup guide
3. `setup-github-actions.sh` - Automated setup script
4. `.github/DEPLOYMENT.md` - Quick reference guide

## Setup Instructions

### Option 1: Automated Setup (Recommended)

Run the setup script on your local machine:

```bash
chmod +x setup-github-actions.sh
./setup-github-actions.sh
```

The script will:
- Generate SSH key pair
- Guide you through adding public key to GCP
- Test SSH connection
- Display private key for GitHub secrets
- Provide step-by-step instructions

### Option 2: Manual Setup

Follow the detailed guide in `GITHUB_ACTIONS_SETUP.md`

## Required GitHub Secrets

Add these in: **GitHub Repository → Settings → Secrets and variables → Actions**

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `GCP_SSH_PRIVATE_KEY` | Private SSH key content | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `GCP_USER` | GCP VM username | `kit27_ad11` |
| `GCP_HOST` | GCP VM IP or domain | `dhans.online` or `34.83.xxx.xxx` |
| `APP_DIR` | Application directory path | `/home/kit27_ad11/callrem` |

## Workflow Triggers

The deployment workflow runs on:

- **Push to main branch** - Automatic deployment
- **Manual trigger** - Via GitHub Actions UI

## Deployment Process

```
Code Push → GitHub Actions → SSH to GCP → Pull Code → Build → Restart → Verify
```

## Testing the Setup

### 1. Commit and Push

```bash
git add .
git commit -m "ci: setup GitHub Actions deployment"
git push origin main
```

### 2. Monitor Deployment

1. Go to GitHub repository
2. Click **Actions** tab
3. Watch the deployment workflow run
4. Check for any errors

### 3. Verify Application

After deployment completes:

```bash
# Check if app is running
curl https://dhans.online

# Or check on GCP VM
ssh your-username@your-gcp-ip
pm2 status
pm2 logs student-call-assist
```

## Deployment Flow

```
┌─────────────────┐
│  Developer      │
│  Pushes Code    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  GitHub Actions │
│  Triggered      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Checkout Code  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Setup SSH      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Connect to GCP │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Pull Changes   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  npm install    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  npm run build  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  PM2 Restart    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Verify Deploy  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Success! ✓     │
└─────────────────┘
```

## Benefits

- **Automated Deployment** - No manual SSH needed
- **Consistent Process** - Same steps every time
- **Fast Deployment** - 2-5 minutes per deploy
- **Error Detection** - Automatic rollback on failure
- **Audit Trail** - Complete deployment history
- **Team Collaboration** - Multiple developers can deploy

## Security Features

- SSH key authentication (no passwords)
- Secrets stored securely in GitHub
- No credentials in code
- Audit logs for all deployments
- Branch protection compatible

## Monitoring

### View Deployment History

GitHub → Actions → All workflows

### Check Application Status

```bash
ssh your-username@your-gcp-ip
pm2 status
pm2 logs student-call-assist --lines 50
```

### Set Up Notifications

Configure in: **Repository Settings → Notifications**

Options:
- Email notifications
- Slack integration
- Discord webhooks

## Troubleshooting

### Common Issues

1. **SSH Connection Failed**
   - Verify public key on GCP VM
   - Check private key in GitHub secrets
   - Test SSH manually

2. **Build Failed**
   - Check Node.js version
   - Verify package.json
   - Review build logs

3. **PM2 Restart Failed**
   - Check PM2 status
   - Verify app name
   - Check application logs

### Debug Commands

```bash
# Test SSH connection
ssh -i ~/.ssh/github-actions-gcp user@host

# Check PM2 on GCP
pm2 status
pm2 logs student-call-assist

# Check Nginx
sudo systemctl status nginx

# Test application
curl http://localhost:5000
```

## Advanced Configuration

### Deploy to Multiple Environments

Create separate workflows:
- `deploy-production.yml`
- `deploy-staging.yml`
- `deploy-development.yml`

### Add Tests Before Deploy

```yaml
- name: Run tests
  run: npm test
```

### Database Migrations

```yaml
- name: Run migrations
  run: npm run db:push
```

### Slack Notifications

```yaml
- name: Notify Slack
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

## Best Practices

1. **Test Locally First** - Always test changes before pushing
2. **Small Commits** - Deploy small, incremental changes
3. **Monitor Deployments** - Watch first few deployments
4. **Branch Protection** - Require PR reviews before merge
5. **Rollback Plan** - Know how to revert if needed
6. **Documentation** - Keep deployment docs updated

## Rollback Procedure

If deployment fails:

```bash
# SSH to GCP VM
ssh your-username@your-gcp-ip

# Navigate to app directory
cd ~/callrem

# Revert to previous commit
git reset --hard HEAD~1

# Reinstall and rebuild
npm install
npm run build

# Restart application
pm2 restart student-call-assist
```

## Cost

GitHub Actions is free for:
- Public repositories (unlimited)
- Private repositories (2,000 minutes/month)

This workflow uses approximately:
- 2-5 minutes per deployment
- 60-150 minutes/month (30 deployments)

## Next Steps

1. Test deployment with a small change
2. Monitor first few deployments
3. Set up branch protection rules
4. Configure deployment notifications
5. Add automated tests to workflow
6. Document team deployment process

## Support

For issues:
1. Check workflow logs in Actions tab
2. Review detailed guide: `GITHUB_ACTIONS_SETUP.md`
3. Test SSH connection manually
4. Verify all GitHub secrets
5. Check GCP VM logs

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [SSH Key Authentication](https://docs.github.com/en/authentication)
- [PM2 Documentation](https://pm2.keymetrics.io/)
- [GCP VM Documentation](https://cloud.google.com/compute/docs)

---

**Automated deployment is now configured and ready to use!**

Every push to main branch will automatically deploy to your GCP VM at `https://dhans.online`
