import nextConfig from "eslint-config-next";

const eslintConfig = [
  ...nextConfig,
  {
    ignores: ["backend-addition/**"],
  },
];

export default eslintConfig;
