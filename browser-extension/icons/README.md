# PrismaX AI Queue Monitor Extension Icons

Since this is a text-based environment, I can't create actual PNG icons. However, here are the SVG icons you can convert to PNG:

## Icon SVG (Save as SVG then convert to PNG in different sizes)

```svg
<svg width="128" height="128" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background circle -->
  <circle cx="64" cy="64" r="56" fill="url(#bg)" stroke="#fff" stroke-width="4"/>
  
  <!-- Robot arm icon -->
  <g transform="translate(32, 32)" fill="white">
    <!-- Base -->
    <rect x="24" y="48" width="16" height="8" rx="2"/>
    
    <!-- Arm segments -->
    <rect x="28" y="32" width="8" height="20" rx="2"/>
    <circle cx="32" cy="32" r="4"/>
    
    <!-- Upper arm -->
    <rect x="20" y="16" width="24" height="6" rx="3"/>
    <circle cx="32" cy="16" r="3"/>
    
    <!-- Gripper -->
    <rect x="30" y="8" width="4" height="12" rx="1"/>
    <rect x="26" y="8" width="2" height="8" rx="1"/>
    <rect x="36" y="8" width="2" height="8" rx="1"/>
  </g>
  
  <!-- Queue indicator -->
  <g transform="translate(80, 20)">
    <circle cx="12" cy="12" r="12" fill="#4CAF50" stroke="#fff" stroke-width="2"/>
    <text x="12" y="17" text-anchor="middle" fill="white" font-family="Arial" font-size="14" font-weight="bold">Q</text>
  </g>
</svg>
```

## To create the icon files:

1. Save the SVG code above as `icon.svg`
2. Use an online SVG to PNG converter or tools like:
   - Figma (import SVG, export as PNG)
   - Canva
   - Adobe Illustrator
   - Inkscape (free)
   - Online tools like convertio.co

3. Export in these sizes:
   - 16x16 px → icon16.png
   - 32x32 px → icon32.png  
   - 48x48 px → icon48.png
   - 128x128 px → icon128.png

4. Place all PNG files in the `/icons/` directory

The icon represents:
- 🎯 Target/monitoring aspect
- 🤖 Robotic arm silhouette
- 📊 Queue indicator (Q badge)
- 💙 PrismaX brand colors (blue gradient)