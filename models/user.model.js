import mongoose, { Schema } from 'mongoose';
import { appConfigs } from '../configs/app_configs.js';

const validRoles = [
    appConfigs.role.superAdmin,
    appConfigs.role.admin,
    appConfigs.role.enseignant,
    appConfigs.role.delegue,
    appConfigs.role.etudiant,
];

const validGenres = [
    appConfigs.genre.masculin,
    appConfigs.genre.feminin,
];

const userSchema = new Schema({
    role: {
        type: String,
        enum: validRoles,
        required: true
    },
    genre: {
        type: String,
        enum: validGenres,
        required: true
    },

    date_creation: { type: Date, required: true },
    nom: { type: String, required: true },
    prenom: { type: String, default: null },

    email: { type: String, required: true },
    mot_de_passe: { type: String, required: true },

    id_commune: { type: mongoose.Schema.Types.ObjectId, default: null },
    id_categorie: { type: mongoose.Schema.Types.ObjectId, default: null },
    id_service: { type: mongoose.Schema.Types.ObjectId, default: null },
    id_grade: { type: mongoose.Schema.Types.ObjectId, default: null },

    matricule: { type: String, default: null },
    date_naiss: { type: Date, default: null },
    lieu_naiss: { type: String, default: null },
    contact: { type: String, default: null },

    status: { type: String, default: "actif" }, // suspendu

    abscences: [{
        date_abs: { type: Date, default: null },
        heure_debut: { type: String, default: null },
        heure_fin: { type: String, default: null },
        semestre: { type: String, default: null },
        annee: { type: String, default: null },
    }],

    historique_connexion: [{ type: Date, default: null }],

});

const User = mongoose.model('User', userSchema, 'users');

export default User;
