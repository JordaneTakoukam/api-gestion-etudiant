import mongoose, { Schema } from 'mongoose';

const matiereSchema = new Schema({
    code: { type: String, required: true },
    libelleFr: { type: String, required: true },
    libelleEn: { type: String, required: true },
    niveau:{ type: mongoose.Schema.Types.ObjectId, ref: 'Niveau', required: true },
    prerequisFr:  { type: String, required: false },
    prerequisEn: { type: String, required: false },
    approchePedFr: { type: String, required: false },
    approchePedEn: { type: String, required: false },
    evaluationAcquisFr: { type: String, required: false },
    evaluationAcquisEn: { type: String, required: false },
    typesEnseignement: [{
        typeEnseignement: { type: mongoose.Schema.Types.ObjectId, ref: 'TypeEnseignement', required: true },
        enseignantPrincipal: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
        enseignantSuppleant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false}
    }],
    chapitres: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Chapitre', required: false }]

});

const Matieres = mongoose.model('Matiere', matiereSchema, 'matiere'); // matieres

export default Matieres;
