import fs from 'fs';
import bcrypt from 'bcrypt';
import mongoosePagination from 'mongoose-paginate-v2';
import path from 'path';

// importar modelo
import User from '../models/user.js';

// importar servicio
import * as validate from '../helpers/validate.js';
import * as jwt from '../services/jwt.js';

// end-point

// registro
export const register = async (req, res) => {
    // recoger datos de la peticion
    let params = req.body;
    console.log(params)
    // comprobar datos + validacion
    if (!params.name || !params.email || !params.password) {
        return res.status(400).json({
            status: "error",
            message: "faltan datos por enviar"
        });
    }

    try {
        validate.validate(params);
    } catch (error) {
        return res.status(400).json({
            status: "error",
            message: "Validacion no superada",
        });
    }

    // consultar si usuario existe en la BD para ser guardado, en el caso de existir indicara que el nick y correo ya existen 
    User.find({
        $or: [
            { email: params.email.toLowerCase() },

        ],
    }).then(async (users) => {
        if (users && users.length >= 1) {
            return res.status(200).send({
                status: "warning",
                message: "El usuario ya existe",
            });
        }

        // Cifrar la contraseña con bcrypt
        let pwd = await bcrypt.hash(params.password, 10);
        params.password = pwd;

        // Crear objeto de usuario para guardar en la BD
        let user_to_save = new User(params);

        // Guardar usuario en la bdd
        user_to_save.save().then((userStored) => {
            // Devolver el resultado
            return res.status(200).json({
                status: "success",
                message: "Usuario registrado correctamente",
                user: userStored,
            });
        }).catch((error) => {
            if (error || !userStored) return res.status(500).send({ status: "error", message: "error al guardar el usuario" });
        });
    });
};

// login
export const login = async (req, res) => {
    let params = req.body;

    if (!params.email || !params.password) {
        return res.status(400).send({
            status: "error_404",
            message: "faltan datos por enviar"
        });
    }

    try {
        // Buscar usuario en la BD
        let user = await User.findOne({ email: params.email });

        if (!user) {
            return res.status(404).json({ status: "Not Found", message: "Usuario no registrado" });
        }

        // Comprobar password que llega por el body y con la password del usuario de la BD
        const pwd = bcrypt.compareSync(params.password, user.password);

        if (!pwd) {
            return res.status(400).send({
                error: "error",
                message: "No te has identificado de forma correcta."
            });
        }

        // Si usuario con cuenta desactivada se loguea nuevamente se cambia estado de cuenta desactivada=true a cuenta desactivada=false
        user.eliminado = false;

        // Guardar el usuario actualizado en la BD
        await user.save();

        // Devolver token
      
        const token = jwt.createToken(user);
        // Devolver datos del usuario
        return res.status(200).json({
            status: "success",
            message: "Te has identificado de forma correcta.",
            user: {
                id: user._id,
                name: user.name,
            },
            token,
        });

    } catch (error) {
        console.error(error);
        return res.status(500).send({
            status: "error",
            message: "error al obtener el usuario en servidor"
        });
    }
};

//actualizar datos del usuario
export const update = async (req, res) => {
    try {
      // Recoger datos del usuario que se actualizará
      const userIdentity = req.user;
      let userToUpdate = req.body;
  
      // Eliminar campos sobrantes
      delete userToUpdate.iat;
      delete userToUpdate.exp;
      delete userToUpdate.role;
      delete userToUpdate.image;
  
      // Comprobar si el usuario ya existe
      const users = await User.find({
        $or: [{ email: userToUpdate.email.toLowerCase() }],
      });
  
      if (!users) {
        return res.status(500).send({ status: "error", message: "No existe el usuario a actualizar" });
      }
  
      let userIsset = false;
      users.forEach((user) => {
        if (user && user._id != userIdentity.id) userIsset = true;
      });
  
      if (userIsset) {
        return res.status(200).send({
          status: "warning",
          message: "El usuario ya existe",
        });
      }
  
      // Si hay contraseña, cifrarla
      if (userToUpdate.password) {
        let pwd = await bcrypt.hash(userToUpdate.password, 10);
        userToUpdate.password = pwd;
      } else {
        delete userToUpdate.password;
      }
  
      // Buscar el usuario y actualizarlo
      const userUpdate = await User.findByIdAndUpdate(userIdentity.id, userToUpdate, { new: true });
  
      if (!userUpdate) {
        return res.status(400).json({ status: "error", message: "Error al actualizar" });
      }
  
      return res.status(200).json({
        status: "success",
        message: "Profile update success",
        user: userUpdate, // Enviar el usuario actualizado
      });
    } catch (error) {
      return res.status(500).send({
        status: "error",
        message: "Error al obtener la información en el servidor",
      });
    }
  };

// perfil
export const profile = async (req, res) => {
    try {
        // Recibir parámetro id por URL
        const id = req.params.id;

        // Buscar el usuario por ID y excluir campos sensibles
        const userProfile = await User.findById(id).select({ "password": 0, "role": 0 });

        if (!userProfile) {
            return res.status(404).json({ status: "error", message: "NO SE HA ENCONTRADO EL USUARIO" });
        }

        // Enviar la respuesta con el perfil del usuario
        return res.status(200).json({
            status: "success",
            message: "profile found successfully",
            user: userProfile
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: "error", message: "error al obtener el usuario en el servidor" });
    }
};


export const avatar = (req, res) => {

    //obtener parametro de la url
    const file = req.params.file
    
    //montar el path real de la image
    const filePath = "./uploads/avatars/" + file

    try {
        //comprobar si archivo existe
        fs.stat(filePath, (error, exist) => {
            if (!exist) {
                return res.status(404).send({
                    status: "error",
                    message: "la image no existe"
                })
            }
            //devolver archivo en el caso de existir  
            return res.sendFile(path.resolve(filePath));
        })

    } catch (error) {
        return res.status(500).send({
            status: "error",
            message: "error al obtener la informacion en servidor"
        })
    }
}

//subida de image
export const upload = async (req, res) => {
    
    //recoger el fichero de image
    if (!req.file) {
        return res.status(404).send({
            status: "error",
            message: "imagen no seleccionada"
        })
    }

    //conseguir nombre del archivo
    let image = req.file.originalname

    //obtener extension del archivo
    const imageSplit = image.split("\.");
    const extension = imageSplit[1].toLowerCase();

    //comprobar extension
    if (extension != "png" && extension != "jpg" && extension != "jpeg" && extension != "gif") {

        //borrar archivo y devolver respuesta en caso de que archivo no sea de extension valida.
        const filePath = req.file.path
        const fileDelete = fs.unlinkSync(filePath)

        //devolver respuesta.        
        return res.status(400).json({
            status: "error",
            mensaje: "Extension no valida"
        })

    }

    try {
        const ImaUpdate = await User.findOneAndUpdate({ _id: req.user.id }, { image: req.file.filename }, { new: true })

        if (!ImaUpdate) {
            return res.status(400).json({ status: "error", message: "error al actualizar" })
        }
        //entrega respuesta corrrecta de image subida
        return res.status(200).json({
            status: "success",
            message: "avatar actualizado",
            user: req.user,
            file: req.file,
            image
        });
    } catch (error) {
        if (error) {
            const filePath = req.file.path
            const fileDelete = fs.unlinkSync(filePath)
            return res.status(500).send({
                status: "error",
                message: "error al obtener la informacion en servidor",
            })
        }

    }

}
