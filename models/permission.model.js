import mongoose, { Schema } from 'mongoose';

const permissionSchema = new mongoose.Schema({
    nom: { type: String, required: true },
    description: { type: String, required: false },
});

const Permission = mongoose.model('Permission', permissionSchema, 'permissions');

export default Permission;
