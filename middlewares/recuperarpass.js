import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';

// Función para crear el transporter
function crearTransporter() {
    const emailUser = process.env.EMAIL_USER;
    const emailPassword = process.env.EMAIL_PASSWORD;

    return nodemailer.createTransport({
        host: 'smtp.zoho.com',
        port: 587,
        secure: false,
        auth: {
            user: emailUser, // Cambia con tu dirección de correo de tu servidor 
            pass: emailPassword // Cambia con tu contraseña
        }
    });
}

// Función para enviar correo de recuperación utilizando servidor SMTP
async function enviarCorreoRecuperacion(email, nuevaContrasena) {
    const transporter = crearTransporter();
    const emailUser = process.env.EMAIL_USER;


    const emailTemplatePath = path.join('uploads', 'html', 'reset-password.html');
    const emailTemplate = fs.readFileSync(emailTemplatePath, 'utf8');

    const mailOptions = {
        from: emailUser, // Cambia con tu dirección de correo de servidor
        to: email,
        subject: 'Recuperación de Contraseña',
        html: emailTemplate.replace('${nuevaContrasena}', nuevaContrasena)
    };

    await transporter.sendMail(mailOptions);
}

// Función para enviar correo de bienvenida con nueva clave de administrador
async function enviarCorreoBienvenida(email, nuevaContrasena) {
    const transporter = crearTransporter();
    const emailUser = process.env.EMAIL_USER;

    const mailOptions = {
        from: emailUser, // Cambia con tu dirección de correo de tu servidor
        to: email,
        subject: 'Bienvenido',
        text: `Tu contraseña temporal es: ${nuevaContrasena}. Te recomendamos cambiarla una vez hayas iniciado sesión.`
    };

    await transporter.sendMail(mailOptions);
}

export default{ enviarCorreoRecuperacion, enviarCorreoBienvenida };
