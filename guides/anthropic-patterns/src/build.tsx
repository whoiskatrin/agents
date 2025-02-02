import { renderToString } from "react-dom/server";
import { Layout } from "./layout";
import path from "node:path";
import fs from "node:fs";
import App from "./app";

export function render(html: string) {
  return renderToString(<Layout>{html}</Layout>);
}

const target = path.join(__dirname, "../", "public", "index.html");

const html = renderToString(
  <Layout>
    <App />
  </Layout>
);

fs.writeFileSync(target, html);
