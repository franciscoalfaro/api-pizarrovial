// Función para generar una nueva contraseña aleatoria
function generarNuevaContrasena() {
    const longitud = 10;
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let nuevaContrasena = '';

    for (let i = 0; i < longitud; i++) {
        nuevaContrasena += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }

    return nuevaContrasena;
}

export default{ generarNuevaContrasena };
