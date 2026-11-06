import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { createApp } from "../../app.js";
import { giftIdeasRepository } from "./giftIdeasRepository.js";
import { giftIdeas as seedData } from "../../data/giftIdeas.js";

const expectedIdeas = [
  { id: 1, idea: "Ravintolaillallinen", price: 80, type: "el\u00e4mys" },
  { id: 2, idea: "Saunavuoro", price: 30, type: "el\u00e4mys" },
  { id: 3, idea: "Konserttiliput", price: 65, type: "el\u00e4mys" },
  { id: 4, idea: "Kahvimuki", price: 15, type: "tuote" },
  { id: 5, idea: "Kirja", price: 25, type: "tuote" },
  { id: 6, idea: "Villapaita", price: 60, type: "tuote" }
];

beforeEach(() => {
  vi.spyOn(giftIdeasRepository, "list").mockImplementation(async () =>
    expectedIdeas.map((giftIdea) => ({ ...giftIdea }))
  );
});
afterEach(() => vi.restoreAllMocks());

describe("gift ideas API", () => {
  it("returns the exact six records as JSON", async () => {
    const response = await request(createApp()).get("/api/gift-ideas");
    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toContain("application/json");
    expect(response.body).toEqual(expectedIdeas);
  });

  it("rejects patch without changing records", async () => {
    const app = createApp();
    const response = await request(app).patch("/api/gift-ideas").send({ idea: "Changed" });
    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "Not found" });
    expect((await request(app).get("/api/gift-ideas")).body).toEqual(expectedIdeas);
  });

  it("returns a single gift idea and 404 for unknown or invalid ids", async () => {
    vi.spyOn(giftIdeasRepository, "getById").mockImplementation(async (id) =>
      expectedIdeas.find((giftIdea) => giftIdea.id === id) ?? null
    );
    const app = createApp();
    const found = await request(app).get("/api/gift-ideas/2");
    expect(found.status).toBe(200);
    expect(found.body).toEqual(expectedIdeas[1]);
    for (const path of ["/api/gift-ideas/999", "/api/gift-ideas/abc"]) {
      const missing = await request(app).get(path);
      expect(missing.status).toBe(404);
      expect(missing.body).toEqual({ error: "Not found" });
    }
  });

  it("creates a gift idea with a generated id", async () => {
    const create = vi.spyOn(giftIdeasRepository, "create").mockImplementation(async (input) => ({ id: 7, ...input }));
    const response = await request(createApp())
      .post("/api/gift-ideas")
      .send({ idea: "  Elokuvaliput  ", price: 24, type: "el\u00e4mys" });
    expect(response.status).toBe(201);
    expect(response.body).toEqual({ id: 7, idea: "Elokuvaliput", price: 24, type: "el\u00e4mys" });
    expect(create).toHaveBeenCalledWith({ idea: "Elokuvaliput", price: 24, type: "el\u00e4mys" });
  });

  it.each([
    [{ price: 10, type: "tuote" }, "idea must be a non-empty string"],
    [{ idea: "  ", price: 10, type: "tuote" }, "idea must be a non-empty string"],
    [{ idea: "Peli", price: -1, type: "tuote" }, "price must be a non-negative number"],
    [{ idea: "Peli", price: "10", type: "tuote" }, "price must be a non-negative number"],
    [{ idea: "Peli", price: 10, type: "muu" }, 'type must be "el\u00e4mys" or "tuote"']
  ])("rejects invalid input %j", async (body, error) => {
    const create = vi.spyOn(giftIdeasRepository, "create");
    const response = await request(createApp()).post("/api/gift-ideas").send(body);
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error });
    expect(create).not.toHaveBeenCalled();
  });

  it("returns 400 for malformed JSON bodies", async () => {
    const response = await request(createApp())
      .post("/api/gift-ideas")
      .set("Content-Type", "application/json")
      .send("{not json");
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Invalid JSON body" });
  });

  it("updates an existing gift idea and returns 404 for a missing one", async () => {
    vi.spyOn(giftIdeasRepository, "update").mockImplementation(async (id, input) =>
      id === 2 ? { id, ...input } : null
    );
    const app = createApp();
    const payload = { idea: "Hierontalahjakortti", price: 55, type: "el\u00e4mys" };
    const updated = await request(app).put("/api/gift-ideas/2").send(payload);
    expect(updated.status).toBe(200);
    expect(updated.body).toEqual({ id: 2, ...payload });
    const missing = await request(app).put("/api/gift-ideas/999").send(payload);
    expect(missing.status).toBe(404);
    expect(missing.body).toEqual({ error: "Not found" });
  });

  it("deletes an existing gift idea and returns 404 for a missing one", async () => {
    vi.spyOn(giftIdeasRepository, "remove").mockImplementation(async (id) => id === 3);
    const app = createApp();
    const removed = await request(app).delete("/api/gift-ideas/3");
    expect(removed.status).toBe(204);
    const missing = await request(app).delete("/api/gift-ideas/999");
    expect(missing.status).toBe(404);
    expect(missing.body).toEqual({ error: "Not found" });
  });

  it("returns JSON 404 for unknown routes", async () => {
    const response = await request(createApp()).get("/missing");
    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "Not found" });
  });

  it("returns a generic error when the repository fails", async () => {
    giftIdeasRepository.list.mockRejectedValue(new Error("Private connection details"));
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const response = await request(createApp()).get("/api/gift-ideas");
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: "Internal server error" });
    expect(log).toHaveBeenCalled();
  });

  it("keeps the MongoDB seed data in sync with the expected records", () => {
    expect(seedData).toEqual(expectedIdeas);
  });
});