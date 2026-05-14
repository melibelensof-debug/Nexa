/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_ADMIN_EMAILS: process.env.ADMIN_EMAILS,
  },
};

export default nextConfig;
