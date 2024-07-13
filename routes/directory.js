import express from "express";
import * as DirectoryController from "../controller/DirectoryController.js";
import { auth as checkAuth } from "../middlewares/auth.js";

const router = express.Router()


router.post("/create",checkAuth, DirectoryController.createDirectory)

router.get("/list",checkAuth, DirectoryController.getDirectories)

router.delete("/delete/:directoryId", checkAuth, DirectoryController.deleteDirectory);


//exportar router
export default router;