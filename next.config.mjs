/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimización estricta de memoria RAM para Render / Vercel (límite < 512MB)
  experimental: {
    cpus: 1,
  },
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  productionBrowserSourceMaps: false,
};

export default nextConfig;
