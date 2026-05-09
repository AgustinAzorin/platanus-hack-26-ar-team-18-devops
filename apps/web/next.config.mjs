/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@repo/types'],
  experimental: {
    typedRoutes: true,
  },
};

export default nextConfig;
