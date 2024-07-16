import express from "express";
import * as DirectoryController from "../controller/DirectoryController.js";
import { auth as checkAuth } from "../middlewares/auth.js";

const router = express.Router()


router.post("/create",checkAuth, DirectoryController.createDirectory)

router.get("/list/:page?",checkAuth, DirectoryController.getDirectories)
router.get("/listAll/:page?",checkAuth, DirectoryController.getAllDirectories)

router.delete("/delete/:directoryId", checkAuth, DirectoryController.deleteDirectory);


//exportar router
export default router;