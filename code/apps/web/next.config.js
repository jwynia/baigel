/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  
  // Static export optimizations
  images: {
    unoptimized: true
  },
  
  // Enable strict mode for better React development
  reactStrictMode: true,
  
  // Trailing slashes for better static hosting
  trailingSlash: true,
};

export default nextConfig;
