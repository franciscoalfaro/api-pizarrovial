import User from '../models/user.js';
import File from '../models/file.js';
import fs from 'fs';
import path from 'path';
import Permision from '../models/permision.js';
import Directory from '../models/directory.js';


export const authorizeDeletion = async (req, res) => {
    //por parametro se enviara el id del usuario creador del archivo o directorio 
    //se enviara el id del directorio o del archivo a eliminar
    //solo el usuario admin dara la autorizacion.
    const { userId, directoryId, fileId } = req.body;
    const adminId = req.user.id; //

    try {
        // Verificar si el usuario autenticado es un administrador
        const adminUser = await User.findById(adminId);

        if (!adminUser || adminUser.role !== 'Admin') {
            return res.status(403).json({ error: 'No tienes permiso para otorgar autorizaciones' });
        }

        let resource;

        if (fileId) {
            // Buscar el archivo por ID
            resource = await File.findById(fileId);
            if (!resource) {
                return res.status(404).json({ error: 'Archivo no encontrado' });
            }
        } else if (directoryId) {
            // Buscar el directorio por ID
            resource = await Directory.findById(directoryId);
            if (!resource) {
                return res.status(404).json({ error: 'Directorio no encontrado' });
            }
        } else {
            return res.status(400).json({ error: 'Se requiere un ID de archivo o directorio' });
        }

        // Verificar si el recurso pertenece al usuario indicado
        if (resource.uploadedBy.toString() !== userId) {
            return res.status(403).json({ error: 'El recurso no pertenece al usuario especificado' });
        }

        // Actualizar el campo createdAt con la fecha y hora actuales
        resource.createdAt = Date.now();
        await resource.save();

        // Verificar si ya existe un permiso para este recurso
        let permision = await Permision.findOne({
            uploadedBy: userId,
            ...(fileId ? { file: fileId } : { directory: directoryId }), // Condición dinámica
        });

        // Si no existe un permiso, crearlo
        if (!permision) {
            permision = new Permision({
                uploadedBy: userId,
                ...(fileId ? { file: fileId } : { directory: directoryId }), // Condición dinámica
                requiresAuthorization: true,
            });
        } else {
            // Si existe, actualizar la autorización
            permision.requiresAuthorization = true;
        }

        await permision.save();

        res.status(200).json({ status: 'success', message: 'Autorización otorgada y hora actualizada para el recurso.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

