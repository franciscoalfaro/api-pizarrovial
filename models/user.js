import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const { Schema, model } = mongoose;

const UserSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    surname: {
        type: String
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        default: "role_user"
    },
    image: {
        type: String,
        default: "default.png"
    },
    eliminado: {
        type: Boolean,
        default: false
    },
    organizacion: {
        type: String,
        default: "default"
    },
    create_at: {
        type: Date,
        default: Date.now
    }
});

UserSchema.plugin(mongoosePaginate);

const User = model("User", UserSchema, "users");

export default User;
