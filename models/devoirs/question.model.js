import mongoose, { Schema } from 'mongoose';

const questionSchema = new mongoose.Schema({
    text_fr: { type: String, required: true },
    text_en: { type: String, required: true },
    type: { type: String, enum: ['QCM', 'VRAI_FAUX'], required: true },
    options_fr: [{ type: String }], // Utilisé pour les QCM
    options_en: [{ type: String }], // Utilisé pour les QCM
    reponseCorrect_fr: { type: String, required: true }, // La réponse correcte
    reponseCorrect_en: { type: String, required: true }, // La réponse correcte
    devoir: { type: mongoose.Schema.Types.ObjectId, ref: 'Devoir', required: true },
});

const Question = mongoose.model('Question', questionSchema, 'questions');

export default Question;
