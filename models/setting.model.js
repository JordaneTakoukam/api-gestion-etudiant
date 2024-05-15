import mongoose, { Schema } from 'mongoose';
import { codeLibelleSchema, communeSchema, cycleSchema, departementSchema, niveauSchema, salleSchema } from './shemas/setting_shema.js';
import { string } from 'yup';

const settingSchema = new Schema({
    anneeCourante:{type:Number},
    premiereAnnee:{type:Number},
    semestreCourant:{type:Number},
    services: [codeLibelleSchema],
    fonctions: [codeLibelleSchema],
    grades: [codeLibelleSchema],
    categories: [codeLibelleSchema],
    regions: [codeLibelleSchema],
    departements: [departementSchema],
    communes: [communeSchema],
    sections: [codeLibelleSchema],
    cycles: [cycleSchema],
    niveaux: [niveauSchema],
    salleDeCours: [salleSchema],
    typesEnseignement: [codeLibelleSchema],
    etatEvenement: [codeLibelleSchema],
    roles: [codeLibelleSchema]
});


const Setting = mongoose.model('Setting', settingSchema, 'settings');
export default Setting;
