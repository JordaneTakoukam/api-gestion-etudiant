import { Schema } from 'mongoose';

export const codeLibelleSchema = new Schema({
    date_creation: { type: Date, required: true },

    code: { type: String, required: true },
    libelle: { type: String, required: true },

});


