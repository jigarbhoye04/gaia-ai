import bundleAnalyzer from "@next/bundle-analyzer";
import createMDX from "@next/mdx";
import { withNextVideo } from "next-video/process";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig = {
  reactStrictMode: false,
  // webpack: (config, { dev, isServer }) => {
  //   if (dev) {
  //     // Reduce parallel processing during development
  //     config.parallelism = 1;

  //     config.cache = false;

  //     // Reduce chunk sizes
  //     config.optimization.splitChunks = {
  //       chunks: "all",
  //       maxInitialRequests: 3,
  //       cacheGroups: {
  //         commons: {
  //           test: /[\\/]node_modules[\\/]/,
  //           name: "vendor",
  //           chunks: "all",
  //         },
  //       },
  //     };
  //   }
  //   return config;
  // },
  // turbopack: {},
  // experimental: {
  // webpackMemoryOptimizations: true,
  // optimizePackageImports: ["@heroui/react"],
  // },
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
  pageExtensions: ["js", "jsx", "mdx", "ts", "tsx"],
  // modularizeImports: {
  //   "@radix-ui/react-icons": {
  //     transform: "@radix-ui/react-icons/dist/{{member}}",
  //   },
  // },
};

const withMDX = createMDX({
  // Add markdown plugins here, as desired
});

export default withNextVideo(withBundleAnalyzer(withMDX(nextConfig)));
