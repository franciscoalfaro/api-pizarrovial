import 'dotenv'
import bcrypt  from 'bcrypt'
import User  from '../models/user.js'
import enviar  from "../middlewares/recuperarpass.js"
import nuevaclave from "../services/generatepassword.js"

export const recuperarContrasena = async (req, res) => {
    const { email } = req.body;
    try {
        // Buscar el usuario por su correo electrónico
        const usuario = await User.findOne({ email });

        if (!usuario) {
            return res.status(404).json({
                status: 'error',
                message: 'El correo electrónico no está registrado'
            });
        }

        // Generar una nueva contraseña temporal
        const nuevaContrasena = nuevaclave.generarNuevaContrasena();
        const hashedPassword = await bcrypt.hash(nuevaContrasena, 10);

        // Actualizar la contraseña hasheada en la base de datos
        usuario.password = hashedPassword;
        await usuario.save();

        // Envío del correo con la nueva contraseña al usuario
        await enviar.enviarCorreoRecuperacion(email, nuevaContrasena);

        return res.status(200).json({
            status: 'success',
            message: 'Se ha enviado una nueva contraseña al correo electrónico registrado'
        });
    } catch (error) {
        return res.status(500).json({
            status: 'error',
            message: 'Error al recuperar la contraseña',
            error: error.message
        });
    }
};



