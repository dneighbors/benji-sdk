import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  input: "./openapi.json",
  output: {
    path: "src/client",
    format: "prettier",
  },
  plugins: [
    "@hey-api/typescript",
    {
      name: "@hey-api/sdk",
      asClass: true,
    },
  ],
});
