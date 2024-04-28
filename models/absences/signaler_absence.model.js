import mongoose, { Schema } from 'mongoose';
import { validRoles } from '../user.model.js';


const signalementAbsenceSchema = new Schema({
    date_creation: { type: Date, default: Date.now },
    role: { type: String, enum: validRoles, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, refPath: 'User', required: true }, // Référence à l'utilisateur (étudiant, délégué, enseignant, admin)
    motif: { type: String, required: true },
    titre: { type: String, default: null },
    description: { type: String, default: null },
    date_debut_absence: { type: Date, required: true },
    date_fin_absence: { type: Date, required: true },
});

const SignalementAbsence = mongoose.model('SignalementAbsence', signalementAbsenceSchema, 'signalementsAbsences');

export default SignalementAbsence;
