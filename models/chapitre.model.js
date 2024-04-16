import mongoose, { Schema } from 'mongoose';

const objectifSchema = new mongoose.Schema({
    code: { type: String, required: true },
    libelleFr: { type: String, required: true },
    libelleEn: { type: String, required: true },
    etat: { type: Number, required: true, enum: [0, 1] }
});


const chapitreSchema = new mongoose.Schema({
    code: { type: String, required: true },
    libelleFr: { type: String, required: true },
    libelleEn: { type: String, required: true },
    typesEnseignement: [{
        typeEnseignement: { type: mongoose.Schema.Types.ObjectId, ref: 'TypeEnseignement' },
        volumeHoraire: Number
    }],
    matiere: { type: mongoose.Schema.Types.ObjectId, ref: 'Matiere', required: true },
    objectifs: [objectifSchema],
});

const Chapitre = mongoose.model('Chapitre', chapitreSchema, 'chapitre');

export default Chapitre;
