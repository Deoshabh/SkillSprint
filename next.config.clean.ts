import type {NextConfig} from 'next';

const isProd = process.env.NODE_ENV === 'production';

const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()'
  },
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.youtube.com https://s.ytimg.com https://www.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' https: data: blob: https://i.ytimg.com https://yt3.ggpht.com https://placehold.co; media-src 'self' https: data: blob:; connect-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com https://placehold.co https://www.youtube.com https://youtube.com https://i.ytimg.com https://yt3.ggpht.com https://www.googleapis.com; frame-src 'self' https://*.youtube.com https://youtube.com https://www.youtube.com https://youtube-nocookie.com https://www.youtube-nocookie.com; object-src 'none'; base-uri 'self'; form-action 'self';"
  }
];

const nextConfig: NextConfig = {
  // Performance optimizations
  compress: isProd,
  poweredByHeader: false,
  reactStrictMode: true,
  swcMinify: isProd,
  generateEtags: false,
  
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
      // Cache static assets
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Cache images
      {
        source: '/_next/image/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  
  // Webpack configuration to handle OpenTelemetry dependencies
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Externalize all OpenTelemetry and Firebase packages completely
      config.externals = config.externals || [];
      config.externals.push({
        '@opentelemetry/api': 'commonjs @opentelemetry/api',
        '@opentelemetry/sdk-node': 'commonjs @opentelemetry/sdk-node',
        '@opentelemetry/auto-instrumentations-node': 'commonjs @opentelemetry/auto-instrumentations-node',
        '@opentelemetry/exporter-trace-otlp-http': 'commonjs @opentelemetry/exporter-trace-otlp-http',
        'firebase-admin': 'commonjs firebase-admin',
        'firebase-functions': 'commonjs firebase-functions',
      });
    }
    
    // Enhanced resolve fallbacks
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
      stream: false,
      url: false,
      zlib: false,
      http: false,
      https: false,
      assert: false,
      os: false,
      path: false,
    };

    return config;
  },
  
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'yt3.ggpht.com',
        port: '',
        pathname: '/**',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    unoptimized: false,
    domains: ['i.ytimg.com', 'yt3.ggpht.com', 'placehold.co'],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // PWA support and optimizations
  experimental: {
    webpackBuildWorker: true,
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
    scrollRestoration: true,
    staleTimes: {
      dynamic: 0, // No cache for dynamic routes
      static: 300, // 5 minutes for static routes
    },
  },
};

export default nextConfig;
