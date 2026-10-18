/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['imapflow', 'nodemailer', 'mailparser'],
  reactStrictMode: true,
};

export default nextConfig;
