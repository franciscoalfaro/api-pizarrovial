import express from "express";
import multer from "multer";
import * as FileController from "../controller/FileController.js"; // Importamos el controlador
import { auth as checkAuth } from "../middlewares/auth.js"; // Middleware de autenticación

const router = express.Router();

// Configuración de Multer con almacenamiento en memoria
const storage = multer.memoryStorage(); // Usamos memoryStorage para tener acceso al archivo en buffer
const upload = multer({ storage });

// Ruta para subir archivos (se conecta con el controlador)
router.post("/subidas/:folderId", checkAuth, upload.array('files'), FileController.uploadFileBuss); // Usamos upload.single('file') para un archivo

export default router;
