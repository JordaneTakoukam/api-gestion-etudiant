import { Timestamp } from 'mongodb';
import mongoose, { Schema } from 'mongoose';

const periodeSchema = new Schema({
    jour: { type: String, required: true }, // Jour de la semaine (ex: Lundi, Mardi, etc.)
    semestre: { type: Number, required: true }, // Semestre (ex: Semestre 1, Semestre 2)
    annee: { type: Number, required: true }, // Année académique
    pause:{type:Boolean, required:true}, //Pause
    niveau: { type: mongoose.Schema.Types.ObjectId, ref: 'Niveau', required: true }, // Référence au niveau
    matiere: { type: mongoose.Schema.Types.ObjectId, ref: 'Matiere', required: false }, // Référence à la matière
    typeEnseignement: { type: mongoose.Schema.Types.ObjectId, ref: 'TypeEnseignement', required: false }, // Référence au type d'enseignement
    heureDebut: { type: String, required: true }, // Heure de début de la période de cours
    heureFin: { type: String, required: true }, // Heure de fin de la période de cours
    salleCours: { type: mongoose.Schema.Types.ObjectId, ref: 'SalleDeCours', required: false }, // Référence à la salle de cours
    enseignantPrincipal:{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    enseignantSuppleant:{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
    
});

const Periodes = mongoose.model('Periode', periodeSchema, 'periodes'); // emploi de temps

export default Periodes;
