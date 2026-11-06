import { giftIdeasRepository } from "./giftIdeasRepository.js";

const validTypes = new Set(["el\u00e4mys", "tuote"]);

function parseGiftIdeaInput(body) {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { error: "Request body must be a JSON object" };
  }
  const { idea, price, type } = body;
  if (typeof idea !== "string" || idea.trim() === "") {
    return { error: "idea must be a non-empty string" };
  }
  if (typeof price !== "number" || !Number.isFinite(price) || price < 0) {
    return { error: "price must be a non-negative number" };
  }
  if (!validTypes.has(type)) {
    return { error: 'type must be "el\u00e4mys" or "tuote"' };
  }
  return { value: { idea: idea.trim(), price, type } };
}

function parseId(raw) {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function listGiftIdeas(request, response) {
  const giftIdeas = await giftIdeasRepository.list();
  response.json(giftIdeas);
}

export async function getGiftIdea(request, response) {
  const id = parseId(request.params.id);
  const giftIdea = id === null ? null : await giftIdeasRepository.getById(id);
  if (!giftIdea) return response.status(404).json({ error: "Not found" });
  response.json(giftIdea);
}

export async function createGiftIdea(request, response) {
  const { value, error } = parseGiftIdeaInput(request.body);
  if (error) return response.status(400).json({ error });
  const giftIdea = await giftIdeasRepository.create(value);
  response.status(201).json(giftIdea);
}

export async function updateGiftIdea(request, response) {
  const id = parseId(request.params.id);
  if (id === null) return response.status(404).json({ error: "Not found" });
  const { value, error } = parseGiftIdeaInput(request.body);
  if (error) return response.status(400).json({ error });
  const giftIdea = await giftIdeasRepository.update(id, value);
  if (!giftIdea) return response.status(404).json({ error: "Not found" });
  response.json(giftIdea);
}

export async function deleteGiftIdea(request, response) {
  const id = parseId(request.params.id);
  const removed = id === null ? false : await giftIdeasRepository.remove(id);
  if (!removed) return response.status(404).json({ error: "Not found" });
  response.status(204).end();
}