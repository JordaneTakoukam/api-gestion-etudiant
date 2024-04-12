import mongoose, { Schema } from 'mongoose';


const matiereEnseignementSchema = new Schema({
    matiere: { type: mongoose.Schema.Types.ObjectId, ref: 'Matiere', required: true },
    typeEnseignement: { type: mongoose.Schema.Types.ObjectId, ref: 'TypeEnseignement', required: true },
    nombreSeance: { type: Number, required: true }
});

const enseignementSchema = new Schema({
    matieres: [matiereEnseignementSchema]
});

const periodeEnseignementSchema = new Schema({
    annee: { type: Number, required: true },
    semestre: { type: Number, required: true },
    periodeFr: { type: String, required: true },
    periodeEn: { type: String, required: true },
    dateDebut:{type:String, required:true},
    dateFin:{type:String, required:true},
    niveau:{ type: mongoose.Schema.Types.ObjectId, ref: 'Niveau', required: true },
    enseignements: [{ type: matiereEnseignementSchema, required: false }],
    date_creation:{ type: Date, required: true },
});

const PeriodeEnseignement = mongoose.model('PeriodeEnseignement', periodeEnseignementSchema, 'periodeEnseignement'); // matieres

export default PeriodeEnseignement;
