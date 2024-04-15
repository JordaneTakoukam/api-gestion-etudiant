import { Timestamp } from 'mongodb';
import mongoose, { Schema } from 'mongoose';

const absenceSchema = new Schema({
    semestre: { type: Number, required: true }, // Semestre (ex: Semestre 1, Semestre 2)
    annee: { type: Number, required: true }, // Année académique
    dateAbscence:{type:Date, required:true},
    heureDebut: { type: String, required: true }, // Heure de début de la période de cours
    heureFin: { type: String, required: true }, // Heure de fin de la période de cours
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },],
    
});

const Absences = mongoose.model('Absence', absenceSchema, 'absences'); // emploi de temps

export default Absences;
