import mongoose, { Schema } from 'mongoose';

const matiereSchema = new Schema({
    code: { type: String, required: false },
    libelleFr: { type: String, required: true },
    libelleEn: { type: String, required: true },
    prerequisFr:  { type: String, required: false },
    prerequisEn: { type: String, required: false },
    approchePedFr: { type: String, required: false },
    approchePedEn: { type: String, required: false },
    evaluationAcquisFr: { type: String, required: false },
    evaluationAcquisEn: { type: String, required: false },
    typesEnseignement: [{ type: mongoose.Schema.Types.ObjectId, ref: 'TypeEnseignement', required: false }],
    chapitres: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Chapitre', required: false }],
    objectifs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Objectif', required: false }]

});

const Matieres = mongoose.model('Matiere', matiereSchema, 'matieres'); // matieres

export default Matieres;
