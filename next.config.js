/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["images.unsplash.com"],
  },
  swcMinify: true,
  poweredByHeader: false,
};

module.exports = nextConfig;
