import { Router } from "express";
import {
    getAuthUrlController,
    authCallbackController,
    authStatusController,
    revokeAuthController,
} from "./auth.controller";

const router = Router();

router.get("/auth/url", getAuthUrlController);
router.get("/auth/callback", authCallbackController);
router.get("/auth/status", authStatusController);
router.post("/auth/revoke", revokeAuthController);

export default router;
