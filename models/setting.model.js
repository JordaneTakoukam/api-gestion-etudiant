import mongoose, { Schema } from 'mongoose';
import { codeLibelleSchema, communeSchema, cycleSchema, departementSchema, niveauSchema, salleSchema} from './shemas/setting_shema.js';

const settingSchema = new Schema({
    services: [codeLibelleSchema],
    fonctions: [codeLibelleSchema],
    grades: [codeLibelleSchema],
    categories: [codeLibelleSchema],
    region: [codeLibelleSchema],
    departement: [departementSchema],
    communes: [communeSchema],
    section: [codeLibelleSchema],
    cycle: [cycleSchema],
    niveau: [niveauSchema],
    salleDeCours:[salleSchema],
    typeEnseignement:[codeLibelleSchema]
});


const Setting = mongoose.model('Setting', settingSchema, 'settings');
export default Setting;
