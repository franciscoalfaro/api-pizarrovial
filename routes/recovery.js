import express from "express";
import * as RecoveryController from "../controller/RecoveryController.js";

const router = express.Router()


router.post("/newpass", RecoveryController.recuperarContrasena)

//exportar router
export default router;