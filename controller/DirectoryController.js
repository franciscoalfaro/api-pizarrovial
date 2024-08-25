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
    console.log(req.body)

    try {
        const baseDir = 'uploads/directorios';
        let parentPath = baseDir; // Ruta base
        let parentNumber = null;
        let parentDirectory = null; // Inicializar parentDirectory

        // Si hay un directorio padre especificado
        if (parent) {
            parentDirectory = await Directory.findById(parent);
            if (!parentDirectory) {
                return res.status(404).json({ error: 'Directorio padre no encontrado' });
            }
            parentPath = path.join(parentDirectory.path); // Obtén la ruta del directorio padre
            parentNumber = parentDirectory.parentNumber;
        } else {
            parentNumber = await getNextParentNumber(); // Para el directorio raíz
        }

        const newPath = path.join(parentPath, name); // Construir la ruta del nuevo directorio

        // Verificar si el directorio ya existe en la base de datos
        const existingDirectory = await Directory.findOne({ name, parent });
        if (existingDirectory) {
            return res.status(400).json({ error: 'El nombre del directorio ya existe. Utiliza otro nombre.' });
        }

        // Crear el directorio físico
        fs.mkdirSync(newPath, { recursive: true });

        // Guardar la información del nuevo directorio en la base de datos
        const newDirectory = new Directory({
            name,
            parent: parent || null, // Asignar el ID del padre o null para el directorio raíz
            parentNumber,
            createdBy,
            path: parentDirectory ? path.join(parentDirectory.path, name).replace(/\\/g, '/') : name // Ruta relativa
        });
        await newDirectory.save();

        return res.status(200).send({
            status: "success",
            message: "directorio creado correctamente",
            newDirectory

        })
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getDirectories = async (req, res) => {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1; // Página actual, por defecto 1
    const limit = parseInt(req.query.limit) || 10; // Límite de archivos por página, por defecto 10

    try {
        // Verificar si el usuario está autenticado
        if (!userId) {
            return res.status(401).json({ error: 'No autorizado. Debes estar autenticado para ver archivos.' });
        }

        // Buscar el directorio raíz del usuario autenticado
        const rootDirectory = await Directory.findOne({ createdBy: userId, parent: null });
        if (!rootDirectory) {
            return res.status(404).json({ error: 'Directorio principal no encontrado' });
        }

        // Contar el total de archivos en el directorio raíz
        const totalFiles = await File.countDocuments({ directory: rootDirectory._id });

        // Obtener los archivos que pertenecen al directorio raíz con paginación
        const files = await File.find({ directory: rootDirectory._id })
            .skip((page - 1) * limit)
            .limit(limit);

        // Listar subdirectorios dentro del directorio raíz
        const subDirectories = await Directory.find({
            parent: rootDirectory._id,
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
                parent: rootDirectory._id,
            }
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
        const dirPath = path.join(directory.path);

        // Eliminar archivos dentro del directorio
        const files = await File.find({ filepath: { $regex: `^${directory.path}` } });
        for (const file of files) {
            const filePath = path.join(file.filepath);
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

        res.status(200).json({ status:"success",message: 'Directorio y su contenido eliminados' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// Obtener todos los subdirectorios de un directorio raiz
export const getAllDirectories = async (req, res) => {
    const { page = 1, limit = 10 } = req.query; // Obtén los parámetros de paginación

    try {
        const options = {
            page: parseInt(page), // Convierte a número
            limit: parseInt(limit), // Convierte a número
            populate: [
                { path: 'createdBy', select: 'name surname' },
            ]
        };

        // Encontrar solo los directorios que son raíces (sin padre)
        const result = await Directory.paginate({ parent: null }, options);

        res.status(200).json({
            status: "success",
            message: "Directorios raíz encontrados",
            directorios: result.docs,
            totalDoc: result.totalDocs,
            limit: result.limit,
            totalPage: result.totalPages,
            page: result.page,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
