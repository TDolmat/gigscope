import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker deployment
  // This creates a minimal server.js with only necessary dependencies
  output: 'standalone',
  
  // Optional: Disable telemetry in production
  // (already set via ENV in Dockerfile, but good to have here too)
};

export default nextConfig;
