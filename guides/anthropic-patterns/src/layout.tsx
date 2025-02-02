export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Anthropic Patterns</title>
        <link rel="stylesheet" href="/normalize.css" />
        <link rel="stylesheet" href="/dist/client.css" />
      </head>
      <body>
        <div id="app">{children}</div>
        <script type="module" src="/dist/client.js"></script>
      </body>
    </html>
  );
}
