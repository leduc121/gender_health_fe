/** @type {import('next').NextConfig} */
const nextConfig = {
  // --- API PROXY REWRITES ---
  // This section proxies requests made to /api/... in your Next.js app
  // to your backend server at https://genderhealthcare.uk/...
  // This is a clean way to make API calls from your frontend without running into CORS issues,
  // as the browser sees the request going to the same origin.
  async rewrites() {
    return [
      {
        // The path in your Next.js app that will be proxied.
        source: "/api/:path*",
        // The actual destination URL.
        destination: "https://genderhealthcare.uk/:path*",
      },
    ];
  },

  // --- CUSTOM HEADERS ---
  // Note: While rewrites are great, the destination server (genderhealthcare.uk)
  // should ideally handle its own CORS policy. However, if you need to add headers
  // from the Next.js proxy server, you can do so here.
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          {
            key: "Access-Control-Allow-Origin",
            // IMPORTANT: This is set to '*' to be permissive. For better security in production,
            // you should restrict this to your actual domain.
            // Example: value: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
            value: "*",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET,DELETE,PATCH,POST,PUT,OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            // Using '*' is convenient but less secure.
            // It's better to list the specific headers your application needs.
            // Example: "X-CSRF-Token, X-Requested-With, Accept, Content-Type"
            value: "*",
          },
        ],
      },
    ];
  },

  // --- IMAGE OPTIMIZATION ---
  images: {
    // The 'domains' property is deprecated.
    // 'remotePatterns' is the modern, more secure way to allow remote images.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "d36tvdh5ecsqm6.cloudfront.net",
        port: "",
        pathname: "/**", // Allow any path from this hostname
      },
      {
        protocol: "https",
        hostname: "d7ps01efynwkd.cloudfront.net",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "genderhealthcare.uk",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "", // You can specify a port like '3000' if needed
        pathname: "/**",
      },
    ],
    // Allows Next.js to optimize SVGs from remote sources. Use with caution.
    dangerouslyAllowSVG: true,
    // A Content Security Policy for images served by Next.js. This is a good security practice.
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

module.exports = nextConfig;
