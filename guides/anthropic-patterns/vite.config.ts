import { cloudflare } from "@cloudflare/vite-plugin";
import { defineConfig } from "vite";
import chalk from "chalk";

export default defineConfig({
  plugins: [
    cloudflare(),
    {
      name: "requestLogger",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const timeString = new Date().toLocaleTimeString();
          console.log(
            `[${chalk.blue(timeString)}] ${chalk.green(
              req.method
            )} ${chalk.yellow(req.url)}`
          );
          next();
        });
      },
    },
  ],
});
