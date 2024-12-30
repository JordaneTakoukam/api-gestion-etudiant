import mongoose, { Schema } from 'mongoose';

const questionSchema = new mongoose.Schema({
    textFr: { type: String, required: true },
    textEn: { type: String, required: true },
    type: { type: String, enum: ['QCM', 'VRAI_FAUX'], required: true },
    nbPoint:{type: Number, required:true}, //Nombre de point de la question
    
    options: [{
        textFr:{ type: String, required: true }, 
        textEn:{ type: String, required: true }, 
        pourcentage: { type: Number, required: true, min: -100, max: 100 }// Pourcentage de la note pour cette option
    }],
   
    devoir: { type: mongoose.Schema.Types.ObjectId, ref: 'Devoir', required: true },
});

const Question = mongoose.model('Question', questionSchema, 'questions');

export default Question;
