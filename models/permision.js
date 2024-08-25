import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';
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
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    deleteAt: { // Nueva propiedad para la fecha y hora de eliminación
        type: Date,
        required: true,
    },
    isDeleted: { // Nueva propiedad para saber si el archivo ha sido eliminado
        type: Boolean,
        default: false,
    },
});

permisionSchema.plugin(mongoosePaginate);

// Middleware para verificar la eliminación
permisionSchema.pre('save', function (next) {
    if (this.isModified('deleteAt') && this.deleteAt <= Date.now()) {
        this.isDeleted = true;
    }
    next();
});

const Permision = model('Permision', permisionSchema, 'permisions');
export default Permision;
