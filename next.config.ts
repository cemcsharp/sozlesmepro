import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: false,
  },
  // 禁用 Next.js 热重载，由 nodemon 处理重编译
  reactStrictMode: false,
  eslint: {
    ignoreDuringBuilds: false,
  },
  // Allow cross-origin requests from preview chat
  allowedDevOrigins: [
    'preview-chat-d3b4eb7e-c111-459c-bbd8-c3fb99270d96.space.z.ai',
    ...(process.env.NODE_ENV === 'development' ? ['http://localhost:3000'] : [])
  ],
  // Enable images from all domains for development
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
