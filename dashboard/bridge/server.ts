import express from "express";
import http from "node:http";
import { WebSocketServer, WebSocket } from "ws";
import type { ClientMessage, ServerMessage } from "./types.js";
import { isValidClientMessage } from "./types.js";

export function startServer(port: number): Promise<http.Server> {
  const app = express();
  app.use(express.json());

  // Health check
  app.get("/health", (_req, res) => {
    res.json({ status: "ok", uptime: process.uptime() });
  });

  // Hook placeholder — wired in Plan 03
  app.post("/hooks/post-tool-use", (req, res) => {
    console.log("[hook] post-tool-use:", JSON.stringify(req.body).slice(0, 200));
    res.sendStatus(200);
  });

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server });

  function broadcast(data: ServerMessage): void {
    const payload = JSON.stringify(data);
    for (const client of wss.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    }
  }

  wss.on("connection", (ws) => {
    console.log("[ws] client connected");

    ws.on("message", (raw) => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(String(raw));
      } catch {
        ws.send(JSON.stringify({ type: "error", message: "Invalid JSON" } satisfies ServerMessage));
        return;
      }

      if (!isValidClientMessage(parsed)) {
        ws.send(JSON.stringify({ type: "error", message: "Invalid message shape" } satisfies ServerMessage));
        return;
      }

      const msg: ClientMessage = parsed;
      switch (msg.type) {
        case "start":
          console.log("[ws] session start requested:", msg.prompt.slice(0, 80));
          break;
        case "follow_up":
          console.log("[ws] follow-up requested:", msg.prompt.slice(0, 80));
          break;
        case "permission_response":
          console.log("[ws] permission response:", msg.id, msg.allowed);
          break;
        case "interrupt":
          console.log("[ws] interrupt requested");
          break;
      }
    });

    ws.on("close", () => {
      console.log("[ws] client disconnected");
    });
  });

  // Graceful shutdown
  function shutdown() {
    console.log("\n[bridge] shutting down...");
    wss.close();
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 3000);
  }
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);

  // Export broadcast for use by other modules
  (server as any).broadcast = broadcast;
  (server as any).wss = wss;

  return new Promise((resolve) => {
    server.listen(port, () => {
      console.log(`[bridge] listening on port ${port}`);
      resolve(server);
    });
  });
}
