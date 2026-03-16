import { z } from 'zod';
import prisma from '../prisma/client.js';

const createBoardSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  color: z.string().optional(),
});

const updateBoardSchema = z.object({
  title: z.string().min(1).optional(),
  color: z.string().optional(),
});

export async function getBoards(req, res, next) {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const in5Days = new Date(startOfToday);
    in5Days.setDate(in5Days.getDate() + 5);

    const boards = await prisma.board.findMany({
      where: { ownerId: req.userId },
      orderBy: { createdAt: 'desc' },
      include: {
        lists: {
          select: {
            id: true,
            cards: {
              select: { dueDate: true },
            },
          },
        },
      },
    });

    const data = boards.map((board) => {
      const allCards = board.lists.flatMap((list) => list.cards);

      const stats = {
        totalLists: board.lists.length,
        totalCards: allCards.length,
        pastDue: allCards.filter(
          (c) => c.dueDate && new Date(c.dueDate) < startOfToday
        ).length,
        dueSoon: allCards.filter((c) => {
          if (!c.dueDate) return false;
          const d = new Date(c.dueDate);
          return d >= startOfToday && d <= in5Days;
        }).length,
      };

      const { lists, ...boardData } = board;
      return { ...boardData, stats };
    });

    res.json({ data });
  } catch (error) {
    next(error);
  }
}

export async function createBoard(req, res, next) {
  try {
    const parsed = createBoardSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }

    const board = await prisma.board.create({
      data: {
        title: parsed.data.title,
        color: parsed.data.color,
        ownerId: req.userId,
      },
    });

    res.status(201).json({ data: board });
  } catch (error) {
    next(error);
  }
}

export async function getBoard(req, res, next) {
  try {
    const board = await prisma.board.findUnique({
      where: { id: req.params.id },
      include: {
        lists: {
          orderBy: { position: 'asc' },
          include: {
            cards: {
              orderBy: { position: 'asc' },
              include: { labels: true },
            },
          },
        },
      },
    });

    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    if (board.ownerId !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ data: board });
  } catch (error) {
    next(error);
  }
}

export async function updateBoard(req, res, next) {
  try {
    const parsed = updateBoardSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }

    const board = await prisma.board.findUnique({
      where: { id: req.params.id },
    });

    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    if (board.ownerId !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updated = await prisma.board.update({
      where: { id: req.params.id },
      data: parsed.data,
    });

    res.json({ data: updated });
  } catch (error) {
    next(error);
  }
}

export async function deleteBoard(req, res, next) {
  try {
    const board = await prisma.board.findUnique({
      where: { id: req.params.id },
    });

    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    if (board.ownerId !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await prisma.board.delete({ where: { id: req.params.id } });

    res.json({ data: { message: 'Board deleted' } });
  } catch (error) {
    next(error);
  }
}
