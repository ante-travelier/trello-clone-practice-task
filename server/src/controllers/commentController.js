import { z } from "zod";
import prisma from "../prisma/client.js";

const createCommentSchema = z.object({
  text: z.string().min(1, "Comment text is required"),
});

export async function getComments(req, res, next) {
  try {
    const card = await prisma.card.findUnique({
      where: { id: req.params.cardId },
      include: { list: { include: { board: true } } },
    });

    if (!card) {
      return res.status(404).json({ error: "Card not found" });
    }

    if (card.list.board.ownerId !== req.userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    const comments = await prisma.comment.findMany({
      where: { cardId: req.params.cardId },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });

    res.json({ data: comments });
  } catch (error) {
    next(error);
  }
}

export async function createComment(req, res, next) {
  try {
    const parsed = createCommentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }

    const card = await prisma.card.findUnique({
      where: { id: req.params.cardId },
      include: { list: { include: { board: true } } },
    });

    if (!card) {
      return res.status(404).json({ error: "Card not found" });
    }

    if (card.list.board.ownerId !== req.userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    const comment = await prisma.comment.create({
      data: {
        text: parsed.data.text,
        cardId: req.params.cardId,
        userId: req.userId,
      },
      include: { user: { select: { name: true } } },
    });

    res.status(201).json({ data: comment });
  } catch (error) {
    next(error);
  }
}
