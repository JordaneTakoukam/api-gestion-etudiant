import mongoose, { Schema } from 'mongoose';

const objectifSchema = new mongoose.Schema({
    annee:{type:Number, required:true},
    semestre:{type:Number, required:true, enum: [1, 2, 3]},
    code: { type: String, required: false },
    libelleFr: { type: String, required: true },
    libelleEn: { type: String, required: true },
    etat: { type: Number, required: true, enum: [0, 1] },
    statut:{ type: Number, required: true, enum: [0, 1] },
    date_etat: {type:Date, required:false},
    matiere: { type: mongoose.Schema.Types.ObjectId, ref: 'Matiere', required: true },
    chapitre: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapitre', required: false },
});


const Objectif = mongoose.model('Objectif', objectifSchema, 'objectifs');

export default Objectif;
