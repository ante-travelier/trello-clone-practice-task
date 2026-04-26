import { z } from 'zod';
import prisma from '../prisma/client.js';

const createSchema = z.object({
  text: z.string().min(1).max(2000),
});

export async function getComments(req, res, next) {
  try {
    const comments = await prisma.comment.findMany({
      where: { cardId: req.params.cardId },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true } } },
    });
    res.json({ data: comments });
  } catch (err) {
    next(err);
  }
}

export async function createComment(req, res, next) {
  try {
    const { text } = createSchema.parse(req.body);

    const card = await prisma.card.findUnique({ where: { id: req.params.cardId } });
    if (!card) return res.status(404).json({ error: 'Card not found' });

    const comment = await prisma.comment.create({
      data: { text, cardId: req.params.cardId, userId: req.userId },
      include: { user: { select: { name: true } } },
    });
    res.status(201).json({ data: comment });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0].message });
    }
    next(err);
  }
}
