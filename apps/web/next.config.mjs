/** @type {import('next').NextConfig} */
const nextConfig = {
  // @personalab/core ships untranspiled TypeScript source (no build step),
  // so it needs to be explicitly opted into Next's compile pipeline.
  transpilePackages: ["@personalab/core"],
};

export default nextConfig;
