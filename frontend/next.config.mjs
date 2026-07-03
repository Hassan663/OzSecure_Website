/** @type {import('next').NextConfig} */

// Allow next/image to optimise images served by our backend's /api/media route
// (uploaded media). Derived from NEXT_PUBLIC_API_URL so it works in dev + prod.
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
let remotePatterns = [];
try {
  const u = new URL(apiUrl);
  remotePatterns = [
    { protocol: u.protocol.replace(':', ''), hostname: u.hostname, port: u.port || '', pathname: '/api/media/**' },
  ];
} catch {
  // leave empty — media images still work via <img>, only next/image opt is skipped
}

const nextConfig = {
  reactStrictMode: true,
  images: { remotePatterns },
};

export default nextConfig;
