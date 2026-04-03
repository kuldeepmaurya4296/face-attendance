import type { NextConfig } from "next";

const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {},
  async rewrites() {
    return [
      {
        source: '/api/ml/:path*',
        destination: 'http://127.0.0.1:8000/api/ml/:path*',
      },
    ];
  },
};

export default nextConfig;
