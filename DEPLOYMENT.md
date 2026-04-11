# 🚀 Vercel Deployment Configuration

## Auto-Deployment Setup

### Required Vercel Dashboard Settings:

1. **Project Settings → General → Root Directory:**
   ```
   defi-copilot-web
   ```

2. **Build & Development Settings:**
   - Framework: `Next.js`
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

3. **Git Settings:**
   - Production Branch: `main`
   - Auto Deploy: ✅ Enabled

### Test Auto-Deploy:

After configuring, push any change:
```bash
git add .
git commit -m "Test auto-deploy"
git push
```

Vercel should automatically:
1. Detect the push
2. Build from `defi-copilot-web` directory
3. Deploy to production

### Troubleshooting:

If auto-deploy doesn't work:
1. Check Vercel Dashboard → Settings → Git
2. Ensure repository is connected
3. Check "Ignored Build Step" is empty
4. Try manual "Redeploy" from Deployments tab
