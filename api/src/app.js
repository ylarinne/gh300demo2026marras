import path from "node:path";
import express from "express";
import { giftIdeasRouter } from "./features/gift-ideas/giftIdeasRoutes.js";

export function createApp({ clientDist = process.env.CLIENT_DIST } = {}) {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json());
  app.use("/api/gift-ideas", giftIdeasRouter);
  if (clientDist) {
    const dist = path.resolve(clientDist);
    app.use(express.static(dist));
    app.use((request, response, next) => {
      if (request.method !== "GET" || request.path.startsWith("/api/")) return next();
      response.sendFile(path.join(dist, "index.html"));
    });
  }
  app.use((request, response) => {
    response.status(404).json({ error: "Not found" });
  });
  app.use((error, request, response, next) => {
    if (response.headersSent) return next(error);
    if (error.type === "entity.parse.failed") {
      return response.status(400).json({ error: "Invalid JSON body" });
    }
    console.error(error);
    response.status(500).json({ error: "Internal server error" });
  });
  return app;
}