import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { getComments, createComment } from '../controllers/commentController.js';

const router = Router({ mergeParams: true });

// Auth requirement: any authenticated user may read and post comments.
// This is intentionally more permissive than the rest of the API (which gates
// on board ownership). Trade-off: forward-compatible with future board sharing
// where multiple users collaborate on the same board.
router.use(authenticate);

router.get('/', getComments);
router.post('/', createComment);

export default router;
