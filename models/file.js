import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';
const { Schema, model } = mongoose;

const fileSchema = new Schema({
    filename: {
        type: String,
        required: true,
    },
    filepath: {
        type: String,
        required: true,
    },
    mimetype: {
        type: String,
        required: true,
    },
    size: {
        type: Number,
        required: true,
    },
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
});

fileSchema.plugin(mongoosePaginate);

const File = model('File', fileSchema, 'files');
export default File;
