import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const permisionSchema = new Schema({
  uploadedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  directory: { 
    type: Schema.Types.ObjectId,
    ref: 'Directory',
    required: false, // Opcional si se puede aplicar a archivos y directorios
  },
  file: { 
    type: Schema.Types.ObjectId,
    ref: 'File',
    required: false, // Opcional si se puede aplicar a archivos
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  requiresAuthorization: { // Indica si se requiere autorización para eliminar después de los 10 min
    type: Boolean,
    default: false,
  },
});

const Permision = model('Permision', permisionSchema, 'permisions');
export default Permision;
