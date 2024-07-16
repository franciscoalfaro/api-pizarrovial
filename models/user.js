import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';
import Directory from '../models/directory.js';
import fs from 'fs';
import path from 'path';

const { Schema, model } = mongoose;

const UserSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    surname: {
        type: String
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        default: "role_user"
    },
    image: {
        type: String,
        default: "default.png"
    },
    eliminado: {
        type: Boolean,
        default: false
    },
    organizacion: {
        type: String,
        default: "default"
    },
    create_at: {
        type: Date,
        default: Date.now
    }
});

// Hook para crear el directorio del usuario
UserSchema.post('save', async function (user) {
    try {
        // Verificar si ya existe el directorio con el nombre del usuario
        const existingDirectory = await Directory.findOne({ name: user.name, createdBy: user._id });

        // Si no existe, crearla
        if (!existingDirectory) {
            const userDirectoryPath = path.join('uploads/directorios', user.name+' '+user.surname);

            // Crear la carpeta en el sistema de archivos
            fs.mkdirSync(userDirectoryPath, { recursive: true });

            // Crear el directorio en la base de datos
            await Directory.create({
                name: user.name,
                createdBy: user._id,
                path: userDirectoryPath, // Guarda la ruta
            });
        }
    } catch (error) {
        console.error('Error al crear el directorio del usuario:', error); 
    }
});

UserSchema.plugin(mongoosePaginate);

const User = model("User", UserSchema, "users");

export default User;
