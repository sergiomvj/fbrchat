import http from "node:http";
import { createApp } from "./app.js";
import { attachSocketServer } from "./socket/index.js";

const port = Number(process.env.BACKEND_PORT || process.env.APP_PORT || 3000);
const server = http.createServer();
const { messageGateway } = attachSocketServer(server);
const app = createApp(messageGateway);

server.on("request", app);

server.listen(port, () => {
  const address = server.address();
  const resolvedPort =
    typeof address === "object" && address !== null ? address.port : port;

  console.log(`[backend] listening on http://localhost:${resolvedPort}`);
});

server.on("error", (error) => {
  console.error("[backend] bootstrap error", error);
  process.exit(1);
});
