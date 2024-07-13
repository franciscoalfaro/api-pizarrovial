import express from "express";
import multer from "multer";
import * as FileController from "../controller/FileController.js";
import { auth as checkAuth } from "../middlewares/auth.js";

const router = express.Router();

// Configuración de subida
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // La carpeta se definirá en el controlador
        cb(null, "./uploads/directorios");
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`); // Usar un nombre único para evitar colisiones
    }
});

const uploads = multer({ storage });

// Endpoint para subir archivos
router.post("/uploads/:folderId", checkAuth, uploads.array('files'), FileController.uploadFile);
router.delete("/delete/:fileId", checkAuth,FileController.deleteFile)

router.get("/files/:folderId", checkAuth, FileController.listFiles);

router.get("/disk-space", checkAuth, FileController.getDiskSpace);

// Exportar router
export default router;
