const withPWA = require("next-pwa")({
  dest: "public",
});
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});
const path = require("path");

module.exports = withPWA(
  withBundleAnalyzer({
    reactStrictMode: true,
    compiler: {
      // ssr and displayName are configured by default
      styledComponents: true,
    },
    eslint: {
      dirs: ["pages", "components", "lib"], // Explicit defaults
    },
    i18n: {
      locales: ["en-GB"],
      defaultLocale: "en-GB",
    },
    webpack: (config, { buildId, dev }) => {
      config.resolve.symlinks = false;
      config.resolve.alias = {
        ...config.resolve.alias,
        react: path.resolve("./node_modules/react"),
        "react-dom": path.resolve("./node_modules/react-dom"),
      };
      return config;
    },
    async headers() {
      return [
        {
          source: "/api/*",
          headers: [
            { key: "Access-Control-Allow-Credentials", value: "true" },
            { key: "Access-Control-Allow-Origin", value: "*" }, 
            { key: "Access-Control-Allow-Methods", value: "GET" },
            { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version" },
          ]
        }
      ]
    },
    async redirects() {
      return [
        {
          source: '/map',
          destination: '/time',
          permanent: false
        },
        {
          source: '/travel',
          destination: '/time',
          permanent: false
        },
      ]
    }
  })
);
