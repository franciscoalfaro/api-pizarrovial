import User from '../models/user.js';
import File from '../models/file.js';
import fs from 'fs';
import path from 'path';
import Permision from '../models/permision.js';


export const authorizeDeletion = async (req, res) => {
    const { userId, directoryId, fileId } = req.body;
    const adminId = req.user.id;

    try {
        const adminUser = await User.findById(adminId);
        if (!adminUser || adminUser.role !== 'Admin') {
            return res.status(403).json({ error: 'No tienes permiso para otorgar autorizaciones' });
        }

        const query = fileId ? { file: fileId } : { directory: directoryId };
        const permision = await Permision.findOne(query);

        if (!permision) {
            return res.status(404).json({ error: 'No se encontró un permiso asociado a este recurso' });
        }

        if (permision.uploadedBy.toString() !== userId) {
            return res.status(403).json({ error: 'El usuario especificado no es el creador del recurso' });
        }

        // Cambiar el estado de autorización
        permision.requiresAuthorization = true;
        await permision.save();

        res.status(200).json({ status: 'success', message: 'Autorización otorgada para eliminar el recurso.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

