/**
 * SkillSprint PWA Service Worker with Ad Blocking
 * TypeScript-based service worker for caching, performance, and ad blocking
 */

// Service Worker Configuration
const CACHE_NAME = 'skillsprint-v2';
const CACHE_VERSION = '2.0.0';
const DEBUG_MODE = true; // Set to false in production

// Static assets to cache
const STATIC_ASSETS = [
  '/',
  '/dashboard',  '/courses',
  '/planner',
  '/progress',
  '/profile',
  '/manifest.json',
  '/logo.webp',
  '/logo.svg',
  // Add critical CSS and JS files
  '/favicon.ico'
];

// YouTube and General Ad Blocking Patterns
const AD_BLOCK_PATTERNS = [
  // YouTube Ad Domains
  '*doubleclick.net*',
  '*googleadservices.com*',
  '*googlesyndication.com*',
  '*googletagservices.com*',
  '*google-analytics.com*',
  '*googletagmanager.com*',
  
  // YouTube Specific Ad Endpoints
  '*youtube.com/api/stats/ads*',
  '*youtube.com/get_video_info?*adformat=*',
  '*youtube.com/pagead/*',
  '*youtube.com/ptracking*',
  '*ytimg.com/generate_204*',
  '*youtube.com/api/stats/playback*',
  
  // General Advertising Networks
  '*facebook.com/tr*',
  '*twitter.com/i/adsct*',
  '*linkedin.com/px*',
  '*amazon-adsystem.com*',
  '*adsystem.amazon.*',
  
  // Analytics (optional - uncomment if you want to block)
  // '*google-analytics.com*',
  // '*analytics.google.com*',
  
  // Common Ad Networks
  '*adsense.*',
  '*adsystem.*',
  '*advertising.*',
  '*ads.*',
  '*adnxs.com*',
  '*adsystem.amazon.*'
];

// Utility Functions

/**
 * Converts wildcard pattern to RegExp
 * @param {string} pattern - Wildcard pattern (e.g., "*google.com*")
 * @returns {RegExp} Regular expression for matching
 */
function wildcardToRegExp(pattern) {
  // Escape special regex characters except * and ?
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  
  // Convert wildcards to regex
  const regexPattern = escaped
    .replace(/\*/g, '.*')  // * matches any characters
    .replace(/\?/g, '.');  // ? matches single character
  
  return new RegExp(`^${regexPattern}$`, 'i'); // Case insensitive
}

/**
 * Check if URL matches any ad blocking pattern
 * @param {string} url - URL to check
 * @returns {boolean} True if URL should be blocked
 */
function shouldBlockRequest(url) {
  return AD_BLOCK_PATTERNS.some(pattern => {
    const regex = wildcardToRegExp(pattern);
    return regex.test(url);
  });
}

/**
 * Log blocked requests in debug mode
 * @param {string} url - Blocked URL
 * @param {string} reason - Reason for blocking
 */
function logBlockedRequest(url, reason = 'Ad pattern match') {
  if (DEBUG_MODE) {
    console.log(`🚫 [SW] Blocked: ${url.substring(0, 100)}... (${reason})`);
  }
}

/**
 * Log allowed requests in debug mode
 * @param {string} url - Allowed URL
 */
function logAllowedRequest(url) {
  if (DEBUG_MODE && url.includes('youtube.com')) {
    console.log(`✅ [SW] Allowed: ${url.substring(0, 100)}...`);
  }
}

/**
 * Create an empty response for blocked requests
 * @returns {Response} Empty 204 No Content response
 */
function createBlockedResponse() {
  return new Response('', {
    status: 204,
    statusText: 'No Content',
    headers: {
      'Content-Type': 'text/plain',
      'X-Blocked-By': 'SkillSprint-SW'
    }
  });
}

/**
 * Handle caching strategy for different resource types
 * @param {Request} request - The fetch request
 * @returns {Promise<Response>} Cached or network response
 */
async function handleCacheStrategy(request) {
  const url = request.url;
  
  // Don't cache POST, PUT, DELETE requests
  if (request.method !== 'GET') {
    return fetch(request);
  }

  // Allow external fonts and resources to pass through without caching
  if (url.includes('fonts.googleapis.com') || 
      url.includes('fonts.gstatic.com') ||
      url.includes('placehold.co') ||
      url.startsWith('https://') && !url.includes(self.location.hostname)) {
    try {
      return await fetch(request, {
        mode: 'cors',
        credentials: 'omit'
      });
    } catch (error) {
      console.warn(`[SW] Failed to fetch external resource: ${url}`, error);
      // Return a minimal response to prevent errors
      if (url.includes('fonts.googleapis.com')) {
        return new Response('/* Font loading failed */', {
          status: 200,
          headers: { 'Content-Type': 'text/css' }
        });
      }
      return new Response('', { status: 503 });
    }
  }
  
  // Different strategies for different resource types
  if (url.includes('/api/')) {
    // API requests: Network first, cache fallback (only for GET requests)
    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    } catch (error) {
      const cachedResponse = await caches.match(request);
      return cachedResponse || new Response('Offline', { status: 503 });
    }
  } else if (url.includes('.js') || url.includes('.css') || url.includes('.png') || url.includes('.jpg')) {
    // Static assets: Cache first, network fallback
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    } catch (error) {
      return new Response('Resource not available offline', { status: 503 });
    }
  } else {
    // HTML pages: Network first, cache fallback
    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    } catch (error) {
      const cachedResponse = await caches.match(request);
      return cachedResponse || caches.match('/');
    }
  }
}

// Service Worker Event Listeners

/**
 * Install Event - Cache static assets
 */
self.addEventListener('install', (event) => {
  console.log(`📦 [SW] Installing version ${CACHE_VERSION}`);
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 [SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('📦 [SW] Installation complete');
        return self.skipWaiting(); // Force activation
      })
      .catch((error) => {
        console.error('📦 [SW] Installation failed:', error);
      })
  );
});

/**
 * Activate Event - Clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log(`🔄 [SW] Activating version ${CACHE_VERSION}`);
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log(`🗑️ [SW] Deleting old cache: ${cacheName}`);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients immediately
      self.clients.claim()
    ]).then(() => {
      console.log('🔄 [SW] Activation complete');
    })
  );
});

/**
 * Fetch Event - Main request interceptor with ad blocking
 */
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = request.url;
  
  // Skip non-HTTP requests
  if (!url.startsWith('http')) {
    return;
  }
  // Skip Next.js development endpoints to prevent interference
  if (url.includes('__nextjs_original-stack-frames') || 
      url.includes('__nextjs') || 
      url.includes('_next/webpack-hmr') ||
      url.includes('/_next/static/development') ||
      url.includes('/api/auth/logout') ||
      url.includes('/api/auth/signout')) {
    return;
  }
  
  event.respondWith(
    (async () => {
      try {
        // Check if request should be blocked
        if (shouldBlockRequest(url)) {
          logBlockedRequest(url);
          return createBlockedResponse();
        }
        
        // Log allowed requests (for debugging)
        logAllowedRequest(url);
        
        // Handle request with appropriate caching strategy
        const response = await handleCacheStrategy(request);
        
        // Ensure we return a valid Response object
        if (response instanceof Response) {
          return response;
        } else {
          console.warn(`[SW] Invalid response for ${url}, creating fallback`);
          return new Response('Service Worker Error', { status: 500 });
        }
      } catch (error) {
        console.error(`[SW] Fetch error for ${url}:`, error);
        
        // Try to return cached response as fallback
        try {
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }
        } catch (cacheError) {
          console.error(`[SW] Cache error for ${url}:`, cacheError);
        }
        
        // Return a proper error response
        return new Response('Network Error', { 
          status: 503, 
          statusText: 'Service Unavailable' 
        });
      }
    })()
  );
});

/**
 * Message Event - Handle messages from main thread
 */
self.addEventListener('message', (event) => {
  const { type, payload } = event.data || {};
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'GET_VERSION':
      event.ports[0].postMessage({
        type: 'VERSION_INFO',
        version: CACHE_VERSION,
        cacheName: CACHE_NAME
      });
      break;
      
    case 'CLEAR_CACHE':
      caches.delete(CACHE_NAME).then(() => {
        event.ports[0].postMessage({
          type: 'CACHE_CLEARED',
          success: true
        });
      });
      break;
      
    case 'UPDATE_DEBUG_MODE':
      DEBUG_MODE = payload.enabled;
      console.log(`🔧 [SW] Debug mode ${DEBUG_MODE ? 'enabled' : 'disabled'}`);
      break;
      
    default:
      console.log('📨 [SW] Unknown message type:', type);
  }
});

/**
 * Background Sync Event - Handle offline actions
 */
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('🔄 [SW] Background sync triggered');
    // Handle background sync tasks here
  }
});

/**
 * Push Event - Handle push notifications
 */
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    console.log('📱 [SW] Push notification received:', data);    event.waitUntil(
      self.registration.showNotification(data.title || 'SkillSprint', {
        body: data.body || 'New update available',
        icon: '/logo.webp',
        badge: '/logo.webp',
        data: data.url || '/'
      })
    );
  }
});

/**
 * Notification Click Event - Handle notification interactions
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data || '/')
  );
});

// Initialize Service Worker
console.log(`🚀 [SW] SkillSprint Service Worker ${CACHE_VERSION} loaded`);
console.log(`🛡️ [SW] Ad blocking enabled with ${AD_BLOCK_PATTERNS.length} patterns`);
console.log(`🔧 [SW] Debug mode: ${DEBUG_MODE ? 'ON' : 'OFF'}`);

/**
 * Error Handling - Global error handler
 */
self.addEventListener('error', (event) => {
  console.error('❌ [SW] Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('❌ [SW] Unhandled promise rejection:', event.reason);
});

// Performance monitoring
if (DEBUG_MODE) {
  let requestCount = 0;
  let blockedCount = 0;
  
  const originalShouldBlock = shouldBlockRequest;
  shouldBlockRequest = function(url) {
    requestCount++;
    const shouldBlock = originalShouldBlock(url);
    if (shouldBlock) blockedCount++;
    
    // Log stats every 100 requests
    if (requestCount % 100 === 0) {
      console.log(`📊 [SW] Stats: ${requestCount} requests, ${blockedCount} blocked (${Math.round(blockedCount/requestCount*100)}%)`);
    }
    
    return shouldBlock;
  };
}
