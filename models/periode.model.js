import mongoose, { Schema } from 'mongoose';

const periodeSchema = new Schema({
    jour: { type: Number, required: true }, // Jour de la semaine (ex: 1=Lundi, 2=Mardi, etc.)
    semestre: { type: Number, required: true }, // Semestre (ex: Semestre 1, Semestre 2)
    annee: { type: Number, required: true }, // Année académique
    pause: { type: Boolean, required: true }, // Pause
    niveau: { type: mongoose.Schema.Types.ObjectId, ref: 'Niveau', required: true }, // Référence au niveau
    heureDebut: { type: String, required: true }, // Heure de début de la période de cours
    heureFin: { type: String, required: true }, // Heure de fin de la période de cours

    // Pour chaque matière, on associe les enseignants, la salle de cours et le type d'enseignement
    enseignements: [{
        matiere: { type: mongoose.Schema.Types.ObjectId, ref: 'Matiere', required: true },
        enseignantPrincipal: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        enseignantSuppleant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
        salleCours: { type: mongoose.Schema.Types.ObjectId, ref: 'SalleDeCours', required: true },
        typeEnseignement: { type: mongoose.Schema.Types.ObjectId, ref: 'TypeEnseignement', required: true }
    }]
});

const Periode = mongoose.model('Periode', periodeSchema, 'periodes'); // emploi de temps

export default Periode;
