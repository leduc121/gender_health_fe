/** @type {import('next').NextConfig} */
const nextConfig = {
  // The rewrites function acts as a URL proxy.
  // It forwards requests made to the Next.js app's /api/* path
  // to the backend server, avoiding CORS issues in the browser.
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://gender-healthcare.org/:path*",
      },
    ];
  },

  /*
   * The `headers` function for setting CORS headers has been removed.
   * Since `rewrites` is used as a proxy, the browser only communicates with your Next.js app (same-origin).
   * The Next.js server communicates with the backend, so CORS should be configured on the backend API (gender-healthcare.org) if it needs to be accessed from other origins.
  */

  images: {
    // Use `remotePatterns` instead of the deprecated `domains` property.
    // This provides more control over allowed external image sources.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "d3fdwgxfvcmuj8.cloudfront.net",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "d4vjsyqlv6u6j.cloudfront.net",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "gender-healthcare.org",
        port: "",
        pathname: "/**",
      },
      // Note: `localhost` was removed. For local images, place them in the `/public` directory.
    ],
    
    // Allows Next.js to optimize SVG images. Use with trusted sources only.
    dangerouslyAllowSVG: true,
    
    // Defines a Content Security Policy for images.
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    
    // The minimum time an optimized image will be cached, in seconds.
    minimumCacheTTL: 60,
  },
};

module.exports = nextConfig;