import mongoose, { Schema } from 'mongoose';
import { codeLibelleSchema, communeSchema, sectionSchema, cycleSchema, departementSchema, niveauSchema, salleSchema, categorieSchema, promotionSchema } from './shemas/setting_shema.js';
import { string } from 'yup';

const settingSchema = new Schema({
    anneeCourante:{type:Number},
    premiereAnnee:{type:Number},
    semestreCourant:{type:Number},
    services: [codeLibelleSchema],
    fonctions: [codeLibelleSchema],
    grades: [codeLibelleSchema],
    categories: [categorieSchema],
    regions: [codeLibelleSchema],
    departements: [departementSchema],
    communes: [communeSchema],
    departementsAcademique:[codeLibelleSchema],
    promotions:[promotionSchema],
    sections: [sectionSchema],
    cycles: [cycleSchema],
    niveaux: [niveauSchema],
    sallesDeCours: [salleSchema],
    typesEnseignement: [codeLibelleSchema],
    etatsEvenement: [codeLibelleSchema],
    roles: [codeLibelleSchema]
});


const Setting = mongoose.model('Setting', settingSchema, 'settings');
export default Setting;
