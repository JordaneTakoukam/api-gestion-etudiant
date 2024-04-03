import mongoose, { Schema } from 'mongoose';
import { codeLibelleSchema, communeSchema, cycleSchema, departementSchema, niveauSchema, salleSchema} from './shemas/setting_shema.js';
import { string } from 'yup';

const settingSchema = new Schema({
    anneeCourante:{type:Number},
    premiereAnnee:{type:Number},
    semestreCourant:{type:Number},
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
    typeEnseignement:[codeLibelleSchema],
    etatEvenement:[codeLibelleSchema],
    roles:[codeLibelleSchema]
});


const Setting = mongoose.model('Setting', settingSchema, 'settings');
export default Setting;
