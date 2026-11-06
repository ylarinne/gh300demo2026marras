import { Router } from "express";
import {
  createGiftIdea,
  deleteGiftIdea,
  getGiftIdea,
  listGiftIdeas,
  updateGiftIdea
} from "./giftIdeasController.js";

export const giftIdeasRouter = Router();
giftIdeasRouter.get("/", listGiftIdeas);
giftIdeasRouter.post("/", createGiftIdea);
giftIdeasRouter.get("/:id", getGiftIdea);
giftIdeasRouter.put("/:id", updateGiftIdea);
giftIdeasRouter.delete("/:id", deleteGiftIdea);