import mongoose, { Schema } from 'mongoose';
import { appConfigs } from '../configs/app_configs.js';

const validRoles = [
    appConfigs.role.superAdmin,
    appConfigs.role.admin,
    appConfigs.role.enseignant,
    appConfigs.role.delegue,
    appConfigs.role.etudiant,
];

const validGenres = [appConfigs.genre.masculin, appConfigs.genre.feminin];

const userSchema = new Schema({
    verificationCode: {
        code: { type: String, default: null },
        expirationDate: { type: Date, default: null },
    },
    roles: [{ type: String, enum: validRoles, required: true }],
    genre: { type: String, enum: validGenres, required: true },
    date_creation: { type: Date, required: true },
    date_entree: { type: String, default: null },
    date_naiss: { type: Date, default: null },

    nom: { type: String, required: true },
    prenom: { type: String, default: null },
    email: { type: String, required: true },
    matricule: { type: String, default: null },

    lieu_naiss: { type: String, default: null },
    contact: { type: String, default: null },
    status: { type: String, default: "actif" },
    historique_connexion: [{ type: Date, default: null }],
    photo_profil: { type: String, default: null },
    mot_de_passe: { type: String, required: true },


    abscence: { type: String, default: null },
    section: { type: String, default: null },
    cycle: { type: String, default: null },
    niveau: { type: String, default: null },

    grade: { type: String, default: null },
    categorie: { type: String, default: null },
    fonction: { type: String, default: null },
    service: { type: String, default: null },
    region: { type: String, default: null },
    departement: { type: String, default: null },
    commune: { type: String, default: null },
});

const User = mongoose.model('User', userSchema, 'users');

export default User;
