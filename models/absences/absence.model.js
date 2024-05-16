import mongoose, { Schema } from 'mongoose';

const absenceSchema = new Schema({
    dateCreation: { type: Date, default: Date.now },
    semestre: { type: Number, required: true }, // Semestre (ex: Semestre 1, Semestre 2)
    annee: { type: Number, required: true }, // Année académique
    dateAbsence: { type: Date, required: true },
    heureDebut: { type: String, required: true }, // Heure de début de la période de cours
    heureFin: { type: String, required: true }, // Heure de fin de la période de cours
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
    etat:{type:Number},
    motif:{type:String}

});

const Absence = mongoose.model('Absence', absenceSchema, 'absences');

export default Absence;
