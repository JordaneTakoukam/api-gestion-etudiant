import mongoose, { Schema } from 'mongoose';

const objectifSchema = new mongoose.Schema({
    code: { type: String, required: true },
    libelleFr: { type: String, required: true },
    libelleEn: { type: String, required: true },
    etat: { type: Number, required: true, enum: [0, 1] }
});


const chapitreSchema = new mongoose.Schema({
    annee:{type:Number, required:true},
    semestre:{type:Number, required:true, enum: [1, 2, 3]},
    code: { type: String, required: false },
    libelleFr: { type: String, required: true },
    libelleEn: { type: String, required: true },
    etat:{ type: Number, required: true, enum: [0, 1] },
    statut:{ type: Number, required: true, enum: [0, 1] },
    typesEnseignement: [{
        typeEnseignement: { type: mongoose.Schema.Types.ObjectId, ref: 'TypeEnseignement' },
        volumeHoraire: Number
    }],
    matiere: { type: mongoose.Schema.Types.ObjectId, ref: 'Matiere', required: true },
    objectifs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Objectif', required: false }]
    // objectifs: [objectifSchema],
});

const Chapitre = mongoose.model('Chapitre', chapitreSchema, 'chapitres');

export default Chapitre;
