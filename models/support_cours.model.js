import mongoose, { Schema } from 'mongoose';

// Modèle pour les supports de cours
const SupportDeCoursSchema = new Schema({
    titre_en: { type: String, required: true },
    titre_fr: { type: String, required: true },
    type:{type:Number, required:true}, //Permet de dire qui a le droit de visualiser le support de cours. enseignant (0) et (1) pour étudiant
    description_en: { type: String },
    description_fr: { type: String },
    fichier: { type: String, required: true }, // Chemin ou URL du fichier
    niveau: { type: Schema.Types.ObjectId, ref: 'Niveau', required: true }, //niveau concerné
    utilisateur: { type: Schema.Types.ObjectId, ref: 'User', required: true }, //utilisateur ayant ajouter le support
    annee:{type:Number, required:true}, //Année académique à laquelle le support à été publié
    dateAjout: { type: Date, default: Date.now },
    size:{type:Number}
});

const SupportDeCours = mongoose.model('SupportDeCours', SupportDeCoursSchema, 'supportDeCours'); // matieres

export default SupportDeCours;
