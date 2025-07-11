import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";

// Polyfill for queueMicrotask in test environment
if (typeof globalThis.queueMicrotask === "undefined") {
  globalThis.queueMicrotask = (callback: Function) => {
    Promise.resolve().then(() => callback());
  };
}

export default defineWorkersConfig({
  test: {
    setupFiles: ["./test-setup.ts"],
    globals: true,
    deps: {
      optimizer: {
        ssr: {
          include: [
            // vitest can't seem to properly import
            // `require('./path/to/anything.json')` files,
            // which ajv uses (by way of @modelcontextprotocol/sdk)
            // the workaround is to add the package to the include list
            "ajv"
          ]
        }
      }
    },
    poolOptions: {
      workers: {
        isolatedStorage: false,
        singleWorker: true,
        wrangler: {
          configPath: "./wrangler.jsonc"
        }
      }
    }
  }
});
