import { withNextVideo } from "next-video/process";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig = {
  reactStrictMode: false,
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      // Reduce parallel processing during development
      config.parallelism = 1;

      config.cache = false;

      // Reduce chunk sizes
      config.optimization.splitChunks = {
        chunks: "all",
        maxInitialRequests: 3,
        cacheGroups: {
          commons: {
            test: /[\\/]node_modules[\\/]/,
            name: "vendor",
            chunks: "all",
          },
        },
      };
    }
    return config;
  },
  experimental: {
    turbo: {
      //   moduleIdStrategy: "deterministic",
    },
    // webpackMemoryOptimizations: true,
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
  distDir: "dist",
  // modularizeImports: {
  //   "@radix-ui/react-icons": {
  //     transform: "@radix-ui/react-icons/dist/{{member}}",
  //   },
  // },
};

export default withNextVideo(withBundleAnalyzer(nextConfig));
