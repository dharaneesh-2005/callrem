# GitHub Actions Setup Script for GCP Deployment (PowerShell)
# Run this script on Windows to set up automated deployment

Write-Host "==========================================" -ForegroundColor Green
Write-Host "GitHub Actions Setup for GCP Deployment" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""

# Step 1: Generate SSH Key
Write-Host "Step 1: Generate SSH Key" -ForegroundColor Cyan
Write-Host "Generating SSH key pair for GitHub Actions..."

$sshKeyPath = "$env:USERPROFILE\.ssh\github-actions-gcp"

if (Test-Path $sshKeyPath) {
    Write-Host "SSH key already exists at $sshKeyPath" -ForegroundColor Yellow
    $overwrite = Read-Host "Do you want to overwrite it? (y/n)"
    if ($overwrite -ne "y") {
        Write-Host "Using existing key..."
    } else {
        ssh-keygen -t ed25519 -C "github-actions" -f $sshKeyPath -N '""'
        Write-Host "✓ New SSH key generated" -ForegroundColor Green
    }
} else {
    # Create .ssh directory if it doesn't exist
    $sshDir = "$env:USERPROFILE\.ssh"
    if (-not (Test-Path $sshDir)) {
        New-Item -ItemType Directory -Path $sshDir | Out-Null
    }
    
    ssh-keygen -t ed25519 -C "github-actions" -f $sshKeyPath -N '""'
    Write-Host "✓ SSH key generated" -ForegroundColor Green
}

Write-Host ""

# Step 2: Display Public Key
Write-Host "Step 2: Public Key" -ForegroundColor Cyan
Write-Host "Copy this public key and add it to your GCP VM:" -ForegroundColor Yellow
Write-Host ""
$publicKey = Get-Content "$sshKeyPath.pub"
Write-Host $publicKey -ForegroundColor Yellow
Write-Host ""
Write-Host "On your GCP VM, run:" -ForegroundColor White
Write-Host "  echo `"$publicKey`" >> ~/.ssh/authorized_keys" -ForegroundColor Gray
Write-Host ""
Read-Host "Press Enter after you've added the public key to your GCP VM"

# Step 3: Get GCP Details
Write-Host ""
Write-Host "Step 3: GCP VM Details" -ForegroundColor Cyan
$gcpUser = Read-Host "Enter your GCP VM username (e.g., kit27_ad11)"
$gcpHost = Read-Host "Enter your GCP VM IP or domain (e.g., dhans.online)"
$appDir = Read-Host "Enter your application directory on GCP (e.g., /home/kit27_ad11/callrem)"

# Step 4: Test SSH Connection
Write-Host ""
Write-Host "Step 4: Testing SSH Connection" -ForegroundColor Cyan
Write-Host "Testing connection to $gcpUser@$gcpHost..."

$testConnection = ssh -i $sshKeyPath -o StrictHostKeyChecking=no "$gcpUser@$gcpHost" "echo 'Connection successful!'" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ SSH connection successful!" -ForegroundColor Green
} else {
    Write-Host "✗ SSH connection failed!" -ForegroundColor Red
    Write-Host "Please ensure:" -ForegroundColor Yellow
    Write-Host "1. Public key is added to ~/.ssh/authorized_keys on GCP VM"
    Write-Host "2. GCP VM is accessible"
    Write-Host "3. Username and host are correct"
    exit 1
}

# Step 5: Display Private Key
Write-Host ""
Write-Host "Step 5: GitHub Secrets" -ForegroundColor Cyan
Write-Host "Add these secrets to your GitHub repository:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Settings → Secrets and variables → Actions → New repository secret" -ForegroundColor Gray
Write-Host ""

Write-Host "1. GCP_SSH_PRIVATE_KEY" -ForegroundColor White
Write-Host "   Copy the entire content below (including BEGIN and END lines):" -ForegroundColor Gray
Write-Host ""
Write-Host "---BEGIN PRIVATE KEY---" -ForegroundColor Yellow
Get-Content $sshKeyPath | Write-Host -ForegroundColor Yellow
Write-Host "---END PRIVATE KEY---" -ForegroundColor Yellow
Write-Host ""
Read-Host "Press Enter after you've added GCP_SSH_PRIVATE_KEY to GitHub"

Write-Host ""
Write-Host "2. GCP_USER" -ForegroundColor White
Write-Host "   Value: $gcpUser" -ForegroundColor Yellow
Write-Host ""
Read-Host "Press Enter after you've added GCP_USER to GitHub"

Write-Host ""
Write-Host "3. GCP_HOST" -ForegroundColor White
Write-Host "   Value: $gcpHost" -ForegroundColor Yellow
Write-Host ""
Read-Host "Press Enter after you've added GCP_HOST to GitHub"

Write-Host ""
Write-Host "4. APP_DIR" -ForegroundColor White
Write-Host "   Value: $appDir" -ForegroundColor Yellow
Write-Host ""
Read-Host "Press Enter after you've added APP_DIR to GitHub"

# Step 6: Summary
Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "✓ Setup Complete!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "--------"
Write-Host "SSH Key: $sshKeyPath"
Write-Host "GCP User: $gcpUser"
Write-Host "GCP Host: $gcpHost"
Write-Host "App Directory: $appDir"
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Commit and push the workflow file:"
Write-Host "   git add .github/workflows/deploy-gcp.yml" -ForegroundColor Gray
Write-Host "   git commit -m 'ci: add GitHub Actions deployment workflow'" -ForegroundColor Gray
Write-Host "   git push origin main" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Monitor deployment:"
Write-Host "   Go to GitHub → Actions tab" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Test manual deployment:"
Write-Host "   Actions → Deploy to GCP → Run workflow" -ForegroundColor Gray
Write-Host ""
Write-Host "Happy deploying!" -ForegroundColor Green
