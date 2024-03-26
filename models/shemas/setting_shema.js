import mongoose, { Schema } from 'mongoose';

export const codeLibelleSchema = new Schema({
    date_creation: { type: Date, required: true },
    code: { type: String, required: true },
    libelleFr: { type: String, required: true },
    libelleEn: { type: String, required: true },

});

export const departementSchema = new Schema({
    // id_region: { type: mongoose.Schema.Types.ObjectId, required: true },
    date_creation: { type: Date, required: true },
    region: { type: mongoose.Schema.Types.ObjectId, ref: 'Region', required: true },
    code: { type: String, required: true },
    libelleFr: { type: String, required: true },
    libelleEn: { type: String, required: true },
});

export const communeSchema = new Schema({
    date_creation: { type: Date, required: true },
    // id_departement: { type: mongoose.Schema.Types.ObjectId, required: true },
    departement: { type: mongoose.Schema.Types.ObjectId, ref: 'Departement', required: true },
    code: { type: String, required: true },
    libelleFr: { type: String, required: true },
    libelleEn: { type: String, required: true },
});

export const cycleSchema = new Schema({
    date_creation: { type: Date, required: true },
    section: { type: mongoose.Schema.Types.ObjectId, ref: 'Section', required: true },
    code: { type: String, required: true },
    libelleFr: { type: String, required: true },
    libelleEn: { type: String, required: true },
});

export const niveauSchema = new Schema({
    date_creation: { type: Date, required: true },
    cycle: { type: mongoose.Schema.Types.ObjectId, ref: 'Cycle', required: true },
    code: { type: String, required: true },
    libelleFr: { type: String, required: true },
    libelleEn: { type: String, required: true },
});

export const salleSchema = new Schema({
    date_creation: { type: Date, required: true },
    code: { type: String, required: true },
    libelleFr: { type: String, required: true },
    libelleEn: { type: String, required: true },
    nbPlace:{type: Number, required:true}
});







