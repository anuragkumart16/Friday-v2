import { Router } from "express";
import brainController from "./controller";

const router = Router()

router.route("/").post(brainController)

export default router