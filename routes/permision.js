import express from "express";
import * as PermisionController from "../controller/PermisionController.js";
import { auth as checkAuth } from "../middlewares/auth.js";

const router = express.Router()


router.post("/autorizacion",checkAuth, PermisionController.authorizeDeletion)



//exportar router
export default router;