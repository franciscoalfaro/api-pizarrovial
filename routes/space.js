import express from "express";
import * as SpaceController from "../controller/SpaceController.js";
import { auth as checkAuth } from "../middlewares/auth.js";

const router = express.Router();


router.get("/disk-space", checkAuth, SpaceController.getDiskSpace);

// Exportar router
export default router;
