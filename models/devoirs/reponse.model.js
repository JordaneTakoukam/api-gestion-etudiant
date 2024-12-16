import mongoose, { Schema } from 'mongoose';

const reponseSchema = new mongoose.Schema({
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    devoir: { type: mongoose.Schema.Types.ObjectId, ref: 'Devoir', required: true },
    attempts: [{
        answers: [{
            question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
            answer: { type: String, required: true }, // Réponse donnée par l'étudiant
        }],
        score: { type: Number, default: 0 }, // Score obtenu pour cette tentative
        submittedAt: { type: Date, default: Date.now },
    }],
    highestScore: { type: Number, default: 0 }, // Meilleure note obtenue parmi les tentatives
});


const Reponse = mongoose.model('Reponse', reponseSchema, 'reponses');

export default Reponse;