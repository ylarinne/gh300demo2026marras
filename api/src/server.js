import { createApp } from "./app.js";

const port = Number(process.env.PORT ?? 3001);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be an integer between 1 and 65535");
}

const host = process.env.HOST ?? "127.0.0.1";

const server = createApp().listen(port, host, () => {
  console.log(`Gift ideas API: http://${host}:${server.address().port}`);
});
server.on("error", (error) => {
  console.error(error);
  process.exitCode = 1;
});