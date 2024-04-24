import mongoose, { Schema } from 'mongoose';

const batimentSchema = new Schema({
    devise: {
        code: { type: String, required: true },
        label: { type: String, required: true }
    },
    nom: { type: String, required: true },
    localisation: {
        pays: { type: String, required: true },
        ville: { type: String, required: true },
        quartier: { type: String }
    },
    date_creation: { type: Date, default: Date.now },
    type: { type: String, required: true },
    extras: [{ type: String }],
    images: [{ type: String }],
});

const Batiment = mongoose.model('Batiment', batimentSchema, 'batiments');

export default Batiment;
