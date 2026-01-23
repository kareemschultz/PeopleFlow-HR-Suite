# App Icons

This directory contains the app icons for the Progressive Web App (PWA).

## Required Icon Sizes

The following icon sizes are required for full PWA support across all platforms:

- **72x72** - Android Chrome, Windows tile
- **96x96** - Android Chrome
- **128x128** - Android Chrome
- **144x144** - Windows tile
- **152x152** - iOS, Windows tile
- **192x192** - Android Chrome (primary)
- **384x384** - Android Chrome, Windows tile
- **512x512** - Android Chrome splash screen

## Icon Requirements

- **Format**: PNG with transparency
- **Purpose**: "maskable any" (supports both regular and maskable icons)
- **Content**: Should include the PeopleFlow logo/brand
- **Safe zone**: For maskable icons, ensure important content is within the central 80% diameter

## Generating Icons

You can use tools like:
- [PWA Asset Generator](https://github.com/elegantapp/pwa-asset-generator)
- [RealFaviconGenerator](https://realfavicongenerator.net/)
- Adobe Photoshop/Illustrator with batch export
- [Figma](https://www.figma.com/) with plugin

## Current Status

⚠️ **TODO**: Generate and add icon files in the sizes listed above.

Example command using PWA Asset Generator:
```bash
npx pwa-asset-generator logo.svg ./public/icons --icon-only --background "#ffffff"
```
