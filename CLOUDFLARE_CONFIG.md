# Cloudflare Configuration Instructions
# To fix the Rocket Loader render-blocking issue:

## Option 1: Disable Rocket Loader (Recommended)
1. Log into Cloudflare Dashboard
2. Go to Speed > Optimization
3. Find "Rocket Loader" 
4. Turn it OFF

## Option 2: Create Page Rule to Disable on Homepage
1. Go to Rules > Page Rules
2. Create new rule for: orbweaver.ca/
3. Settings:
   - Rocket Loader: OFF
   - Cache Level: Standard
   - Browser Cache TTL: Respect Existing Headers

## Option 3: Use Cloudflare Workers (Advanced)
Add this to disable Rocket Loader via Workers:
```javascript
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const response = await fetch(request)
  const newResponse = new Response(response.body, response)
  newResponse.headers.set('CF-Rocket-Loader', 'off')
  return newResponse
}
```

## Recommended Cloudflare Settings:
- Auto Minify: HTML, CSS, JavaScript (ON)
- Brotli: ON
- Early Hints: ON
- HTTP/3 (with QUIC): ON
- Rocket Loader: OFF (causes render blocking)
- Mirage: OFF (not needed with modern image formats)
- Polish: Lossy (if using Cloudflare Pro)

## Browser Cache TTL:
Set to "Respect Existing Headers" since we have proper cache headers configured.
