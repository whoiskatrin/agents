import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";

export default defineWorkersConfig({
  test: {
    globalSetup: "global-setup.ts",
    inspector: {
      enabled: true,
      port: 3333,
      waitForDebugger: true,
    },
    poolOptions: {
      workers: {
        isolatedStorage: false,
        singleWorker: false,
        wrangler: {
          configPath: "./wrangler.toml",
        },
      },
    },
  },
});
