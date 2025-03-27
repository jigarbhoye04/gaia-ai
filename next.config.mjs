import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig = {
  // reactStrictMode: true,
  reactStrictMode: false,
  experimental: {
    // turbo: {
    //   moduleIdStrategy: "deterministic",
    // },
    webpackMemoryOptimizations: true,
    // optimizePackageImports: ["@heroui/react"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  },
  modularizeImports: {
    "@radix-ui/react-icons": {
      transform: "@radix-ui/react-icons/dist/{{member}}",
    },
  },
};

export default withBundleAnalyzer(nextConfig);
