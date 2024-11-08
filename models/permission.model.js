import mongoose, { Schema } from 'mongoose';

const permissionSchema = new mongoose.Schema({
    nom: { type: String, required: true },
    libelleFr: { type: String, required: true },
    libelleEn: { type: String, required: true },
    descriptionFr: { type: String, required: false },
    descriptionEn: { type: String, required: false },
});

const Permission = mongoose.model('Permission', permissionSchema, 'permissions');

export default Permission;
