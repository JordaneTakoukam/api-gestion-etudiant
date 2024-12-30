import mongoose, { Schema } from 'mongoose';

const devoirSchema = new mongoose.Schema({
    titreFr: { type: String, required: true },
    titreEn: { type: String, required: true },
    descriptionFr: { type: String },
    descriptionEn: { type: String },
    utilisateur: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // utilisateur qui a crée le devoir
    niveau: { type: mongoose.Schema.Types.ObjectId, ref: 'Niveau', required: true },
    noteSur:{type:Number, required: true},
    questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }], // Référence aux questions
    deadline: { type: Date, required: true },
    ordreAleatoire: { type: Boolean, default: false }, // Si les questions doivent être affichées aléatoirement
    tentativesMax: { type: Number, default: 1 }, // Nombre maximum de tentatives autorisées
    feedbackConfig: {
        afficherNoteApresSoumission: { type: Boolean, default: false }, // Montrer la note après soumission
        afficherCorrectionApresSoumission: { type: Boolean, default: false }, // Montrer la correction après soumission
        afficherNoteApresDeadline: { type: Boolean, default: true }, // Montrer la note après le deadline
        afficherCorrectionApresDeadline: { type: Boolean, default: true }, // Montrer la correction après le deadline
    },
    annee: { type: Number}, // Année de création
    createdAt: { type: Date, default: Date.now },
});


const Devoir = mongoose.model('Devoir', devoirSchema, 'devoirs');

export default Devoir;