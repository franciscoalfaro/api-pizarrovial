import Directory from '../models/directory.js';
import File from '../models/file.js'; // Asegúrate de importar tu modelo de archivos
import fs from 'fs';
import path from 'path';
import { getDiskInfo } from 'node-disk-info';

export const uploadFile = async (req, res) => {
    const { folderId, directory } = req.params;
    const userId = req.user.id; // ID del usuario autenticado

    try {
        // Buscar el directorio por ID
        const directory = await Directory.findById(folderId);
        if (!directory) {
            return res.status(404).json({ error: 'Directorio no encontrado' });
        }

        // Recoger archivos subidos
        const files = req.files;
        if (!files || files.length === 0) {
            return res.status(400).json({ error: 'No se han subido archivos' });
        }

        // Obtener el directorio actual

        const uploadPath = path.join(directory.path);
        console.log('actual',uploadPath)

        // Asegurarse de que la carpeta de destino exista
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true }); // Crear la carpeta si no existe
        }

        const uploadedFiles = [];

        // Mover archivos a la carpeta correspondiente
        for (const file of files) {
            const filePath = path.join(uploadPath, file.filename);
            console.log(filePath)
            fs.renameSync(file.path, filePath); // Mover el archivo subido a la carpeta correspondiente

            // Crear un objeto de archivo para guardar en la base de datos
            const newFile = new File({
                filename: file.filename,
                filepath: path.join(directory.path, file.filename).replace(/\\/g, '/'), // Guardar la ruta relativa
                mimetype: file.mimetype,
                size: file.size,
                uploadedBy: userId,
                directory: folderId
            });

            await newFile.save(); // Guardar el archivo en la base de datos
            uploadedFiles.push(newFile);
        }

        res.status(201).json({ message: 'Archivos subidos correctamente', files: uploadedFiles });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Eliminar un archivo
export const deleteFile = async (req, res) => {
    const { fileId } = req.params;
    const userId = req.user.id; // ID del usuario autenticado
 

    try {
        // Buscar el archivo en la base de datos
        const file = await File.findById(fileId);
        if (!file) {
            return res.status(404).json({ error: 'Archivo no encontrado' });
        }

        // Verificar que el usuario autenticado sea el creador del archivo
        if (file.uploadedBy.toString() !== userId) {
            return res.status(403).json({ error: 'No tienes permiso para eliminar este archivo' });
        }

        // Construir la ruta del archivo
        const filePath = path.join(file.filepath);

        // Eliminar el archivo físico
        fs.unlinkSync(filePath);

        // Eliminar el registro de la base de datos
        await File.findByIdAndDelete(fileId);

        res.status(200).json({ message: 'Archivo eliminado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Listar todo lo de una carpeta ya sea carpetas y archivos. se debe de corregir el filtrado de files, que se encuentran en un
export const listFiles = async (req, res) => {
    const { folderId } = req.params;
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1; // Página actual, por defecto 1
    const limit = parseInt(req.query.limit) || 10; // Límite de archivos por página, por defecto 10

    try {
        if (!userId) {
            return res.status(401).json({ error: 'No autorizado. Debes estar autenticado para ver archivos.' });
        }

        // Verificar si el directorio existe
        const directory = await Directory.findById(folderId);
        if (!directory) {
            return res.status(404).json({ error: 'Directorio no encontrado' });
        }

        // Contar el total de archivos en el directorio
        const totalFiles = await File.countDocuments({ directory: folderId });

        // Obtener los archivos que pertenecen al directorio con paginación
        const files = await File.find({ directory: folderId })
            .skip((page - 1) * limit)
            .limit(limit);

        // Listar subdirectorios dentro del directorio actual
        const subDirectories = await Directory.find({
            parent: directory._id,
            createdBy: userId
        });

        res.status(200).json({
            status: "success",
            message: "Archivos y directorios encontrados",
            resultado: {
                totalFiles,
                currentPage: page,
                totalPages: Math.ceil(totalFiles / limit),
                files,
                directorios: subDirectories,
                parent: directory._id,
            }
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};




export const downloadFile = async (req, res) => {
    const { fileId } = req.params;
    const userId = req.user.id;

    try {

        if (!userId) {
            return res.status(401).json({ error: 'No autorizado. Debes estar autenticado para descargar archivos.' });
        }
        // Buscar el archivo en la base de datos
        const file = await File.findById(fileId);
        if (!file) {
            return res.status(404).json({ error: 'Archivo no encontrado' });
        }

        // Construir la ruta del archivo
        const filePath = path.join(file.filepath);


        // Verificar si el archivo existe
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'Archivo no encontrado en el sistema de archivos' });
        }

        // Enviar el archivo al cliente
        res.download(filePath, file.filename, (err) => {
            if (err) {
                return res.status(500).json({ error: 'Error al descargar el archivo' });
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


export const getDiskSpace = async (req, res) => {
    try {
        const disks = await getDiskInfo();
        
        // Obtener la información del primer disco disponible
        const diskInfo = disks[0]; // Esto selecciona el primer disco en la lista

        if (!diskInfo) {
            return res.status(404).json({ error: 'No se encontró información del disco' });
        }

        const totalSpaceGB = Math.round(diskInfo._blocks / (1024 * 1024)); // Redondear a GB
        const freeSpaceGB = Math.round(diskInfo._available / (1024 * 1024)); // Redondear espacio libre a GB
        const usedSpaceGB = Math.round(totalSpaceGB - freeSpaceGB); // Redondear espacio usado a GB

        res.status(200).json({
            Total: totalSpaceGB,
            Usado: usedSpaceGB,
            Disponible: freeSpaceGB,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
