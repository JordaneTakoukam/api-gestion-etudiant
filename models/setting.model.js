import mongoose, { Schema } from 'mongoose';
import { codeLibelleSchema } from './shemas/setting_shema.js';

const settingSchema = new Schema({
    services: [codeLibelleSchema],
    fonctions: [codeLibelleSchema],
    grades: [codeLibelleSchema],
    categories: [codeLibelleSchema],
    region: [codeLibelleSchema],
    departement: [codeLibelleSchema],
    communes: [codeLibelleSchema],
    sections: [codeLibelleSchema],
    cycles: [codeLibelleSchema],
    niveaux: [codeLibelleSchema],
});


const Setting = mongoose.model('Setting', settingSchema, 'settings');

export default Setting;
