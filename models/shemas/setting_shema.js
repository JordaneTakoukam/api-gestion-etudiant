import mongoose, { Schema } from 'mongoose';

export const codeLibelleSchema = new Schema({
    date_creation: { type: Date, required: true },

    code: { type: String, required: true },
    libelle: { type: String, required: true },

});



export const departementSchema = new Schema({
    id_region: { type: mongoose.Schema.Types.ObjectId, required: true },
    date_creation: { type: Date, required: true },

    code: { type: String, required: true },
    libelle: { type: String, required: true },

});


export const communeSchema = new Schema({
    date_creation: { type: Date, required: true },
    id_departement: { type: mongoose.Schema.Types.ObjectId, required: true },
    code: { type: String, required: true },
    libelle: { type: String, required: true },
});


export const niveauSchema = new Schema({
    date_creation: { type: Date, required: true },
    id_cycle: { type: mongoose.Schema.Types.ObjectId, required: true },
    code: { type: String, required: true },
    libelle: { type: String, required: true },
});

export const cycleSchema = new Schema({
    date_creation: { type: Date, required: true },
    id_section: { type: mongoose.Schema.Types.ObjectId, required: true },
    code: { type: String, required: true },
    libelle: { type: String, required: true },
});





