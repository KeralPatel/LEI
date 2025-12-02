/** @type {import('next').NextConfig} */
const nextConfig = {
  // App directory is enabled by default in Next.js 13+
  // Increase API route timeout for long-running operations like token distribution
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
}

// For Next.js 13+ API routes, set maxDuration
if (typeof nextConfig.api === 'undefined') {
  nextConfig.api = {}
}
nextConfig.api.bodyParser = {
  sizeLimit: '10mb',
}

module.exports = nextConfig
