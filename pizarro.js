//importar dependencia de conexion
import {connection} from './database/connection.js'
import express from "express"
import cors from  "cors"


// efectuar conexion a BD
connection();

//crear conexion a servidor de node
const app = express();
const puerto = 3007;

//configurar cors
app.use(cors({
    exposedHeaders: ['Content-Disposition']
  }));

//conertir los datos del body a obj js
app.use(express.json());
app.use(express.urlencoded({extended:true}));


//cargar rutas
import UserRoutes from "./routes/user.js";
import RecoveryRoutes from "./routes/recovery.js";
import DirectoryRoutes from "./routes/directory.js";
import FileRoutes from "./routes/file.js";
import AutorizaRoutes from "./routes/permision.js";


// llamado a la ruta user
app.use("/api/user", UserRoutes);

//recovery
app.use("/api/recovery", RecoveryRoutes)

//directorios
app.use("/api/directory",DirectoryRoutes)

//archivos
app.use("/api/file",FileRoutes)

//permisos
app.use("/api/permision",AutorizaRoutes)

app.listen(puerto, ()=> {
    console.log("Server runing in port :" +puerto)
})