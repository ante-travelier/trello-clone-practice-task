import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import {
  getComments,
  createComment,
} from "../controllers/commentController.js";

const router = Router();

router.get("/cards/:cardId/comments", authenticate, getComments);
router.post("/cards/:cardId/comments", authenticate, createComment);

export default router;
