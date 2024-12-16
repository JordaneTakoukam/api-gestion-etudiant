import mongoose, { Schema } from 'mongoose';

const questionSchema = new mongoose.Schema({
    text: { type: String, required: true },
    type: { type: String, enum: ['QCM', 'VRAI_FAUX'], required: true },
    options: [{ type: String }], // Utilisé pour les QCM
    correctAnswer: { type: String, required: true }, // La réponse correcte
    devoir: { type: mongoose.Schema.Types.ObjectId, ref: 'Devoir', required: true },
});

const Question = mongoose.model('Question', questionSchema, 'questions');

export default Question;
