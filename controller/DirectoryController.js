import Directory from '../models/directory.js';
import File from '../models/file.js';
import fs from 'fs';
import path from 'path';


const getNextParentNumber = async () => {
    const lastDirectory = await Directory.findOne({ parent: null }).sort({ parentNumber: -1 });
    return lastDirectory ? lastDirectory.parentNumber + 1 : 1;
};

export const createDirectory = async (req, res) => {
    const { name, parent } = req.body;
    const createdBy = req.user.id; // Usar el ID del usuario autenticado

    try {
        const baseDir = 'uploads/directorios';
        let parentPath = baseDir;
        let parentNumber = null;

        if (parent) {
            const parentDirectory = await Directory.findById(parent);
            if (!parentDirectory) {
                return res.status(404).json({ error: 'Directorio padre no encontrado' });
            }
            parentPath = path.join(baseDir, parentDirectory.path); // Aquí se obtiene la ruta del padre
            parentNumber = parentDirectory.parentNumber;
        } else {
            parentNumber = await getNextParentNumber(); // Para el directorio raíz
        }

        const newPath = path.join(parentPath, name); // Solo se agrega el nuevo nombre al path del padre

        // Verificar si el directorio ya existe en la base de datos
        const existingDirectory = await Directory.findOne({ name, parent });
        if (existingDirectory) {
            return res.status(400).json({ error: 'El nombre del directorio ya existe. Utiliza otro nombre.' });
        }

        // Crear el directorio físico
        fs.mkdirSync(newPath, { recursive: true });

        // Guardar la información del directorio en la base de datos
        const newDirectory = new Directory({
            name,
            parent: parent || null, // Asignar el ID del padre o null para el directorio raíz
            parentNumber,
            createdBy,
            path: newPath.replace(/\\/g, '/').replace(baseDir, '') // Asegurarse de que el path esté correcto
        });
        await newDirectory.save();

        res.status(201).json(newDirectory);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Obtener todos los directorios
export const getDirectories = async (req, res) => {
    const userId = req.user.id; // ID del usuario autenticado
    const { page = 1, limit = 10 } = req.query; // Obtén los parámetros de paginación

    try {
        const options = {
            page: parseInt(page), // Convierte a número
            limit: parseInt(limit), // Convierte a número
        };

        // Encontrar solo los directorios que no tienen padre y fueron creados por el usuario
        const result = await Directory.paginate({ parent: null, createdBy: userId }, options);

        res.status(200).json({
            directorios:result.docs,
            totalDoc:result.totalDocs,
            limit:result.limit,
            totalPage:result.totalPages,
            page: result.page,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

//elimninar directorio con todo dentro de su interior y sus datos de la bd
export const deleteDirectory = async (req, res) => {
    const { directoryId } = req.params;
    const userId = req.user.id; // ID del usuario autenticado

    try {
        // Buscar el directorio por ID
        const directory = await Directory.findById(directoryId);
        if (!directory) {
            return res.status(404).json({ error: 'Directorio no encontrado' });
        }

        // Verificar que el usuario autenticado sea el creador del directorio
        if (directory.createdBy.toString() !== userId) {
            return res.status(403).json({ error: 'No tienes permiso para eliminar este directorio' });
        }

        // Obtener la ruta del directorio
        const dirPath = path.join('uploads/directorios', directory.path);

        // Eliminar archivos dentro del directorio
        const files = await File.find({ filepath: { $regex: `^${directory.path}` } });
        for (const file of files) {
            const filePath = path.join('uploads/directorios', file.filepath);
            fs.unlinkSync(filePath); // Eliminar archivo físico
            await File.findByIdAndDelete(file._id); // Eliminar el registro de la base de datos
        }

        // Eliminar subdirectorios de forma recursiva
        const subDirectories = await Directory.find({ parent: directoryId });
        for (const subDir of subDirectories) {
            await deleteDirectory({ params: { directoryId: subDir._id } }); // Llamada recursiva
        }

        // Finalmente, eliminar el directorio
        await Directory.findByIdAndDelete(directoryId);
        fs.rmSync(dirPath, { recursive: true }); // Eliminar el directorio físico

        res.status(200).json({ message: 'Directorio y su contenido eliminados' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};



// Obtener todos los subdirectorios de un directorio raiz

