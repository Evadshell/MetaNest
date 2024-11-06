import dotenv from 'dotenv';
dotenv.config();
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['lh3.googleusercontent.com'],
  },
  webpack: (config) => {
    config.externals = [...(config.externals || []), { canvas: 'canvas' }];
    return config;
  },
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
