import mongoose, { Schema } from 'mongoose';

const objectifSchema = new mongoose.Schema({
    code: { type: String, required: true },
    libelleFr: { type: String, required: true },
    libelleEn: { type: String, required: true },
    etat: { type: Number, required: true, enum: [0, 1] },
    date_etat: {type:Date, required:false},
    matiere: { type: mongoose.Schema.Types.ObjectId, ref: 'Matiere', required: true },
});


const Objectif = mongoose.model('Objectif', objectifSchema, 'objectif');

export default Objectif;
