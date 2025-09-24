# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Orbweaver Natural Landcare is a static website for a landscaping business in Cowichan Valley, BC. The site is built with vanilla HTML, CSS, and JavaScript, optimized for performance and accessibility.

## Architecture

### Core Files
- `index.html` - Main landing page with embedded critical CSS
- `styles.min.css` - Complete stylesheet with modern button system and responsive design
- `js/main.js` - Consolidated JavaScript using module pattern (OrbweaverApp)
- `manifest.json` - PWA configuration
- `sw.js` - Service worker for caching

### Key Features
- **Progressive Web App** - Service worker, manifest, offline page
- **Performance Optimized** - Critical CSS inlined, image optimization with modern formats
- **Accessibility First** - WCAG compliant, semantic HTML, focus management
- **Modern CSS** - CSS custom properties, container queries, view transitions
- **Responsive Design** - Mobile-first approach with touch-friendly carousels

## Development Commands

This is a static site with no build process. Changes are made directly to source files.

### Local Development
```bash
# Serve locally (any static server)
python -m http.server 8000
# or
npx serve .
```

### Testing
- **Accessibility**: Use axe DevTools or Lighthouse accessibility audit
- **Performance**: Lighthouse performance audit
- **Cross-browser**: Test in Chrome, Firefox, Safari

## Code Architecture

### JavaScript (js/main.js)
- **Module Pattern**: All code wrapped in IIFE to avoid global namespace pollution
- **OrbweaverApp Object**: Central state management and initialization
- **Event-Driven**: Form handling, carousel navigation, resize management
- **Performance**: Throttled scroll handlers, passive event listeners

### CSS Architecture (styles.min.css)
- **Design System**: CSS custom properties for colors and spacing
- **Component-Based**: Modular button system with variants
- **Modern Features**: Container queries, view transitions, prefers-reduced-motion
- **Dark Mode**: Automatic system preference detection

### Button System
The site uses a comprehensive button system with:
- Base `.btn` class with consistent typography and spacing
- Variants: `.btn-primary`, `.btn-secondary`, `.btn-outline`, `.btn-ghost`
- Size modifiers: `.btn--small`, `.btn--large`
- States: hover, active, disabled, loading
- Accessibility: focus-visible, reduced motion support

## Deployment

### Hosting
- **Cloudflare Pages** - Static hosting with edge optimization
- **Custom Domain**: orbweaver.ca
- **SSL**: Automatic HTTPS

### Cloudflare Configuration
Critical settings documented in `CLOUDFLARE_CONFIG.md`:
- Rocket Loader: OFF (causes render blocking)
- Polish: OFF or Lossless (preserves image formats)
- Cache TTL: Respect existing headers

## Performance Considerations

- **Critical CSS** inlined in `<head>` for above-the-fold content
- **Image Optimization** using AVIF/WebP with fallbacks
- **Font Loading** optimized with preconnect and font-display
- **Service Worker** caches static assets
- **Minimal JavaScript** - no frameworks, vanilla JS only

## Content Management

- **Form Handling**: Formspree integration for contact form
- **SEO**: Structured data (JSON-LD) for local business
- **Meta Tags**: Complete OpenGraph and meta descriptions

## Common Tasks

### Adding New Button Variants
Use existing button system in `styles.min.css` - follow the pattern of `.btn-[variant]` classes.

### Modifying Carousels
Touch-enabled carousels managed in `js/main.js` with keyboard navigation and dot indicators.

### Performance Optimization
Focus on image optimization and Cloudflare configuration rather than code changes.