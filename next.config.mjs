/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimización de memoria RAM para contenedores de 1GB en Render / Vercel
  experimental: {
    cpus: 1,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
