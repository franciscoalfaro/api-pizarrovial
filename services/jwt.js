import dotenv from 'dotenv';
dotenv.config();

// importar dependencias
import jwt from "jwt-simple";
import moment from 'moment';

// clave secreta
const secret_key = process.env.SECRET_KEY;

// crear funcion para generar tokens
export const createToken = (user) => {
    const payload = {
        id: user._id,
        name: user.name,
        surname: user.surname,
        email: user.email,
        role: user.role,
        image: user.image,
        organizacion:user.organizacion,
        iat: moment().unix(),
        exp: moment().add(30, "days").unix()
    };
    // devolver jwt token
    return jwt.encode(payload, secret_key);
};

export { secret_key };
