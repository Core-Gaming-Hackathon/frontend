/** @type {import('next').NextConfig} */

// Define the base configuration
const nextConfig = {
  // Your essential settings
  reactStrictMode: true,
  
  // Production optimizations
  poweredByHeader: false, // Remove X-Powered-By header
  compress: true, // Enable gzip compression
  
  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  
  // Server components configuration
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000'],
      streamingMetadata: true,
    },
  },
  
  // Exclude test files from the build
  eslint: {
    ignoreDuringBuilds: true, // Ignore ESLint errors during build
  },
  typescript: {
    ignoreBuildErrors: true, // Ignore TypeScript errors during build
  },
  
  // Only add other options if you specifically need them
};

// Export the configuration
module.exports = nextConfig;