import mongoose from "mongoose";
import 'dotenv'

export const connection = async() => {

    try {
        //conexion mediante url a la BD mongo        
        await mongoose.connect(process.env.MONGODB_URI,)
  
        console.log("Connection success")
        
    } catch (error) {
        console.log(error);
        throw new Error("The connection has been refused..");
        
    }

}