import express from "express";
import multer from "multer";
import * as UserController from "../controller/UserController.js";
import { auth as checkAuth } from "../middlewares/auth.js";

const router = express.Router();

// Configuración de subida
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "./uploads/avatars");
    },
    filename: (req, file, cb) => {
        cb(null, "avatar-" + Date.now() + "-" + file.originalname);
    }
});

const uploads = multer({ storage });

// Definir rutas
router.post("/register", UserController.register);
router.post("/login", UserController.login);
router.get("/profile/:id", checkAuth, UserController.profile);
router.put("/update", checkAuth, UserController.update);
router.post("/upload", [checkAuth, uploads.single("file0")], UserController.upload);
router.get("/avatar/:file", UserController.avatar);

// Exportar router
export default router;
