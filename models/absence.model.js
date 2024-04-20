import mongoose, { Schema } from 'mongoose';

const absenceSchema = new Schema({
    dateCreation: { type: Date, default: Date.now },
    semestre: { type: String, required: true }, // Semestre (ex: Semestre 1, Semestre 2)
    annee: { type: String, required: true }, // Année académique
    dateAbsence: { type: Date, required: true },
    heureDebut: { type: String, required: true }, // Heure de début de la période de cours
    heureFin: { type: String, required: true }, // Heure de fin de la période de cours
    // users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },],

});

const Absence = mongoose.model('Absence', absenceSchema, 'absences');

export default Absence;
