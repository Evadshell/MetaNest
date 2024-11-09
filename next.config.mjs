import dotenv from 'dotenv';
dotenv.config();

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Image configuration
  images: {
    domains: ['lh3.googleusercontent.com', 'avatars.githubusercontent.com'],
  },

  // Webpack configuration for canvas
  webpack: (config) => {
    config.externals = [...(config.externals || []), { canvas: 'canvas' }];
    return config;
  },

  // Server configuration
  experimental: {
    serverActions: true,
  },

  // Headers for auth0 and caching
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate',
          },
        ],
      },
    ];
  },

  // Rewrites for WebSocket
  async rewrites() {
    return [
      {
        source: "/api/socket",
        destination: "/api/socket", // WebSocket endpoint
      },
    ];
  },
};

export default nextConfig;