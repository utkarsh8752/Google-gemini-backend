import { Router } from "express";
import {
  chat,
  history,
  clearHistory,
  publicChat,
} from "../controllers/chatController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/chat", requireAuth, chat);
router.get("/history", requireAuth, history);
router.delete("/history", requireAuth, clearHistory);
router.post("/content", publicChat); // legacy public endpoint

export default router;
