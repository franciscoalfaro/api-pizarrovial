import Directory from '../models/directory.js';
import File from '../models/file.js'; // Asegúrate de importar tu modelo de archivos
import fs from 'fs';
import path from 'path';
import { getDiskInfo } from 'node-disk-info';
import Permision from '../models/permision.js';

//extensiones permitidas
const allowedExtensions = ['pdf', 'png', 'jpg', 'jpeg', 'gif', 'docx', 'xlsx', 'txt'];
//extensiones no permitidas
const disallowedExtensions = ['exe','bat', 'sh'];

export const uploadFile = async (req, res) => {
    const { folderId } = req.params;
    const userId = req.user.id; // ID del usuario autenticado

    try {
        // Verificar si el directorio existe
        const directory = await Directory.findById(folderId);
        if (!directory) {
            if (req.files) {
                req.files.forEach(file => {
                    if (fs.existsSync(file.path)) {
                        fs.unlinkSync(file.path); // Eliminar archivo temporal
                    }
                });
            }
            return res.status(404).json({ error: 'Directorio no encontrado. No se han subido archivos.' });
        }

        // Recoger archivos subidos
        const files = req.files;
        if (!files || files.length === 0) {
            return res.status(400).json({error: 'No se han subido archivos', error: 'No se han subido archivos' });
        }

        const uploadedFiles = [];
        const uploadPath = path.join(directory.path);

        for (const file of files) {
            const fileExtension = path.extname(file.originalname).slice(1).toLowerCase();

            if (allowedExtensions.includes(fileExtension) && !disallowedExtensions.includes(fileExtension)) {
                const filePath = path.join(uploadPath, file.originalname);

                fs.renameSync(file.path, filePath);

                // Crear el archivo en la base de datos
                const newFile = new File({
                    filename: file.originalname,
                    filepath: path.join(directory.path, file.originalname).replace(/\\/g, '/'),
                    mimetype: file.mimetype,
                    size: file.size,
                    uploadedBy: userId,
                    directory: folderId
                });

                await newFile.save();

                // Crear un permiso para el archivo
                const permision = new Permision({
                    uploadedBy: userId,
                    file: newFile._id,
                });

                await permision.save(); // Guardar el permiso

                uploadedFiles.push(newFile);
            } else {
                if (fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                }
                return res.status(400).json({ status: "error", message: `Extensión no permitida: ${fileExtension}. No se han subido archivos.` });
            }
        }

        res.status(201).json({ status: "success", message: 'Archivos subidos correctamente', files: uploadedFiles });

    } catch (error) {
        if (req.files) {
            req.files.forEach(file => {
                if (fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                }
            });
        }
        res.status(500).json({ error: error.message });
    }
};



// Eliminar un archivo
export const deleteFile = async (req, res) => {
    const { fileId } = req.params;
    const userId = req.user.id;

    try {
        const file = await File.findById(fileId);
        if (!file) {
            return res.status(404).json({ error: 'Archivo no encontrado' });
        }

        // Verificar si el usuario que intenta eliminar el archivo es el que lo subió
        if (file.uploadedBy.toString() !== userId) {
            return res.status(403).json({ error: 'No tienes permiso para eliminar este archivo' });
        }

        const createdAt = file.createdAt.getTime();
        const now = Date.now();
        const tenMinutesInMilliseconds = 10 * 60 * 1000;

        // Si el archivo fue creado hace menos de 10 minutos, eliminarlo sin necesidad de autorización
        if (now - createdAt <= tenMinutesInMilliseconds) {
            const filePath = path.join(file.filepath);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
            await File.findByIdAndDelete(fileId);
            return res.status(200).json({ status: "success", message: 'Archivo eliminado sin necesidad de autorización' });
        }

        // Si han pasado más de 10 minutos, verificar si tiene autorización para eliminar
        const permision = await Permision.findOne({ file: fileId, uploadedBy: userId });
        if (!permision || !permision.requiresAuthorization) {
            return res.status(403).json({message: 'Se debe solicitar autorización para eliminar este archivo', error: 'Se debe solicitar autorización para eliminar este archivo' });
        }

        // Eliminar el archivo si la autorización existe
        const filePath = path.join(file.filepath);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        await File.findByIdAndDelete(fileId);

        // Opcional: eliminar el permiso asociado después de eliminar el archivo
        await Permision.findOneAndDelete({ file: fileId, uploadedBy: userId });

        res.status(200).json({ status: "success", message: 'Archivo eliminado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};




// Listar todo lo de una carpeta ya sea carpetas y archivos. se debe de corregir el filtrado de files, que se encuentran en un
export const listFiles = async (req, res) => {
    const { folderId } = req.params;
    const page = parseInt(req.query.page) || 1; // Página actual, por defecto 1
    const limit = parseInt(req.query.limit) || 10; // Límite de archivos por página, por defecto 10

    try {
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

        // Listar todos los subdirectorios dentro del directorio actual (sin filtrar por el creador)
        const subDirectories = await Directory.find({
            parent: directory._id
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

        // Construir la ruta completa del archivo
        const filePath = path.resolve(file.filepath);

        // Verificar si el archivo existe en el sistema de archivos
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'Archivo no encontrado en el sistema de archivos' });
        }

        // Configurar el tipo de contenido basado en la extensión del archivo
        const mimeType = file.mimetype || 'application/octet-stream';
        console.log(file.filename)
        res.setHeader('Content-Type', mimeType);

        // Establecer cabeceras adicionales para asegurar una correcta descarga
        res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
        res.setHeader('Content-Length', file.size);

        // Leer y enviar el archivo al cliente como un flujo de datos
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);

        // Manejar posibles errores durante la lectura del archivo
        fileStream.on('error', (err) => {
            return res.status(500).json({ error: 'Error al descargar el archivo' });
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
