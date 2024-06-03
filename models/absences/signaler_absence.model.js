import mongoose, { Schema } from 'mongoose';
import { validRoles } from '../user.model.js';


const signalementAbsenceSchema = new Schema({
    date_creation: { type: Date, default: Date.now },
    role: { type: String, enum: validRoles, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Référence à l'utilisateur (étudiant, délégué, enseignant, admin)
    enseignant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false }, // Référence à l'enseignant concerné par l'absence de l'étudiant
    heure_debut_absence: { type: String, required: true },
    heure_fin_absence: { type: String, required: true },
    jour_absence: { type: Number, required: true },
    date_absence_signaler: { type: Date, required: true },
    semestre: { type: Number, required: true },
    annee: { type: Number, required: true },
    niveau: { type: mongoose.Schema.Types.ObjectId, ref: 'Niveau', required: true },
});


const SignalementAbsence = mongoose.model('SignalementAbsence', signalementAbsenceSchema, 'signalementsAbsences');

export default SignalementAbsence;

