import { Router } from "express";
import { brainControllerForGuest, brainControllerForMasterUser } from "./controller";
import injectionCheckMiddleware from "../middlewares/injectionCheck.middleware";

const router = Router()

// router.post("/", brainControllerForGuest)
router.post("/guest", injectionCheckMiddleware, brainControllerForGuest)
router.post("/master", injectionCheckMiddleware, brainControllerForMasterUser)

export default router