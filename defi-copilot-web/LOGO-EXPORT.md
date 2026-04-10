# Copilot Logo Export Guide

## 🎨 Logo Design

The Copilot logo is a **navigation compass** combined with an **AI neural network** design, representing guidance and intelligence in DeFi trading.

**Design Elements:**
- Gradient orange/brown circle (warm, inviting)
- Compass points (North, East, South, West) for navigation
- Central neural network node with connections
- Orbital rings suggesting movement and connectivity
- Clean, modern aesthetic matching the warm color palette

## 📥 How to Export Logo as PNG

### Method 1: Use the Logo Export Tool
1. Open in browser: `http://localhost:3000/logo-export.html`
2. Choose your desired size (512x512, 256x256, 128x128, or 64x64)
3. Click the "Download" button under each logo
4. Or right-click on the canvas and "Save Image As..."

### Method 2: Take a Screenshot
1. Navigate to the main app at `http://localhost:3000`
2. The logo appears in the sidebar (32x32)
3. The large logo appears in the center greeting (64x64)
4. Use screenshot tools to capture and crop

## 🎨 Color Palette

```
Primary Gradient:
- Start: #E8744F
- Mid:   #D4764B  
- End:   #C96A42

Background:
- Main:    #2B2520
- Sidebar: #1F1B18
- Hover:   #3D352F

Text:
- Foreground: #E8D5C4
- Muted:      #8B7E74
- Subtle:     #6B5F54
```

## 📁 Logo Files

- **Component**: `/components/logo.tsx` - React SVG component
- **Favicon**: `/public/favicon.svg` - Browser tab icon
- **Export Tool**: `/public/logo-export.html` - PNG export utility

## 🖼️ Usage in Code

```tsx
import { CopilotLogo, CopilotLogoSmall } from '@/components/logo'

// Large logo (default 32px)
<CopilotLogo size={64} />

// Small logo (default 24px)  
<CopilotLogoSmall size={32} />
```

## 🎯 Branding

**Name**: Copilot  
**Tagline**: Your intelligent companion for DeFi trading and portfolio management  
**Style**: Warm, professional, modern, inviting
