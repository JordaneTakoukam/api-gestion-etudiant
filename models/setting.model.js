import mongoose, { Schema } from 'mongoose';


const settingSchema = new Schema({
    services: [{
        code: { type: String, required: true },
        libelle: { type: String, required: true },
    }],
    fonctions: [{
        code: { type: String, required: true },
        libelle: { type: String, required: true },
    }],
    grades: [{
        code: { type: String, required: true },
        libelle: { type: String, required: true },
    }],
    categories: [{
        code: { type: String, required: true },
        libelle: { type: String, required: true },
    }],
    region: [{
        code: { type: String, required: true },
        libelle: { type: String, required: true },
    }],
    departement: [{
        code: { type: String, required: true },
        libelle: { type: String, required: true },
    }],
    communes: [{
        code: { type: String, required: true },
        libelle: { type: String, required: true },
    }],
    sections: [{
        code: { type: String, required: true },
        libelle: { type: String, required: true },
    }],
    cycles: [{
        code: { type: String, required: true },
        libelle: { type: String, required: true },
    }],
    niveaux: [{
        code: { type: String, required: true },
        libelle: { type: String, required: true },
    }],
    salleDeCours: [{
        code: { type: String, required: true },
        libelle: { type: String, required: true },
    }],

});

const Setting = mongoose.model('Setting', settingSchema, 'settings');

export default Setting;
