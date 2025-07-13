/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure webpack for Windows development
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Reduce file system operations on Windows
      config.watchOptions = {
        poll: 1000, // Use polling instead of native file watching
        aggregateTimeout: 300,
        ignored: ['**/node_modules/**', '**/.next/**']
      };
    }
    return config;
  },
  
  // Configure allowed dev origins for network access (root level for Next.js 15)
  allowedDevOrigins: ['192.168.20.242:3000', 'localhost:3000'],
  
  // Optimize for Windows development
  onDemandEntries: {
    // Period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // Number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2,
  },
  
  // Disable x-powered-by header
  poweredByHeader: false,
}

module.exports = nextConfig;
