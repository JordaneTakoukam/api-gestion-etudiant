import mongoose, { Schema } from 'mongoose';

const reponseSchema = new mongoose.Schema({
    etudiant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    devoir: { type: mongoose.Schema.Types.ObjectId, ref: 'Devoir', required: true },
    tentative: [{
        reponses: [{
            question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
            reponse: { type: String, required: true }, // Réponse donnée par l'étudiant
        }],
        score: { type: Number, default: 0 }, // Score obtenu pour cette tentative
        dateSoumission: { type: Date, default: Date.now },
    }],
    meilleureScore: { type: Number, default: 0 }, // Meilleure note obtenue parmi les tentatives
});


const Reponse = mongoose.model('Reponse', reponseSchema, 'reponses');

export default Reponse;