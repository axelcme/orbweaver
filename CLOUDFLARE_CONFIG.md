# Cloudflare Configuration Instructions
# To fix the Rocket Loader render-blocking issue and image/caching problems:

## CRITICAL FIXES NEEDED:

### 1. Disable Rocket Loader (REQUIRED - causes 150ms delay)
1. Log into Cloudflare Dashboard
2. Go to Speed > Optimization
3. Find "Rocket Loader" 
4. Turn it OFF

### 2. Fix Image Optimization (Cloudflare is changing JPG to AVIF)
1. Go to Speed > Optimization > Images
2. Either:
   - Turn OFF "Polish" completely, OR
   - Set Polish to "Lossless" (not "Lossy")
3. Turn OFF "WebP" conversion
4. Turn OFF "AVIF" conversion

### 3. Fix Cache Headers (showing 4h instead of 1 year)
1. Go to Caching > Configuration
2. Set Browser Cache TTL to: **"Respect Existing Headers"**
3. DO NOT use a specific TTL value - this overrides your headers

### 4. Create Page Rules for Better Control
1. Go to Rules > Page Rules
2. Create rule for: `orbweaver.ca/*`
3. Settings:
   - Cache Level: **Standard**
   - Browser Cache TTL: **Respect Existing Headers**
   - Disable Performance: **ON** (turns off Rocket Loader)
   - Disable Apps: **ON**
   - Polish: **OFF**

## Recommended Cloudflare Settings:
- **Auto Minify:** HTML, CSS, JavaScript (ON)
- **Brotli:** ON
- **Early Hints:** ON  
- **HTTP/3 (with QUIC):** ON
- **Rocket Loader:** OFF ⚠️ (causes render blocking)
- **Polish:** OFF or Lossless only (not Lossy - it's changing your images)
- **WebP/AVIF conversion:** OFF (you're already serving these formats)
- **Mirage:** OFF (not needed with modern image formats)
- **Browser Cache TTL:** Respect Existing Headers ⚠️

## Alternative: Bypass Cloudflare for Images
If Cloudflare keeps transforming images, add a Page Rule:
- URL: `orbweaver.ca/images/*`
- Cache Level: **Bypass**
- This serves images directly from your origin server

## Testing:
After making changes:
1. Purge Cloudflare cache (Caching > Configuration > Purge Everything)
2. Wait 5 minutes for propagation
3. Test in Incognito/Private mode
4. Run Lighthouse again

The main issues are:
- Rocket Loader adding 150ms delay
- Polish/Image optimization changing your JPGs to AVIF
- Browser Cache TTL overriding your 1-year headers with 4h
