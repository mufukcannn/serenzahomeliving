/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: process.env.NODE_ENV === "development",
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "cdn.dsmcdn.com" }
    ],
    deviceSizes: [360, 414, 640, 750, 768, 828, 1024, 1080, 1200, 1280, 1536, 1920, 2048, 3840],
    imageSizes: [64, 96, 128, 256, 384]
  }
};

export default nextConfig;
