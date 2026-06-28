/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  webpack: (config) => {
    // pino-pretty is an optional dev-only logger dep pulled in transitively by
    // WalletConnect/thirdweb; it's never used in the browser. Mark it external
    // so webpack stops warning it can't resolve it.
    config.externals.push("pino-pretty");
    return config;
  },
};

export default nextConfig;
