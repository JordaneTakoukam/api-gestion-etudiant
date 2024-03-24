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
    matricule: { type: String, default: null },

    roles: [{
        type: String,
        enum: validRoles,
        required: true
    }],


    date_creation: { type: Date, required: true },
    nom: { type: String, required: true },
    prenom: { type: String, default: null },

    date_naiss: { type: Date, default: null },
    lieu_naiss: { type: String, default: null },

    genre: {
        type: String,
        enum: validGenres,
        required: true
    },

    email: { type: String, required: true },
    contact: { type: String, default: null },

    section: { type: String, default: null },
    cycle: { type: String, default: null },
    niveau: { type: String, default: null },

    grades: { type: String, default: null },
    categories: { type: String, default: null },
    fonction: { type: String, default: null },
    service: { type: String, default: null },
    region: { type: String, default: null },
    departement: { type: String, default: null },
    communes: { type: String, default: null },


    date_entree: { type: String, default: null },
    photo_profil: { type: String, default: null },

    status: { type: String, default: "actif" },
    mot_de_passe: { type: String, required: true },


    abscences: [{
        date_abscence: { type: Date, default: null },
        heure_debut: { type: String, default: null },
        heure_fin: { type: String, default: null },
        semestre: { type: String, default: null },
        annee: { type: String, default: null },
    }],

    historique_connexion: [{ type: Date, default: null }],

});

const User = mongoose.model('User', userSchema, 'users');

export default User;
