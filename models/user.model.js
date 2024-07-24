import mongoose, { Schema } from 'mongoose';
import { appConfigs } from '../configs/app_configs.js';

export const validRoles = [
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
    nationalite: { type: String, default: null },
    diplomeEntre: { type: String, default: null },

    lieu_naiss: { type: String, default: null },
    contact: { type: String, default: null },
    status: { type: String, default: "actif" },
    historique_connexion: [{ type: Date, default: null }],
    photo_profil: { type: String, default: null },
    mot_de_passe: { type: String, required: true },

    absences: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Absence', required: false }],
    niveaux: [{
        niveau: { type: mongoose.Schema.Types.ObjectId, ref: 'Niveau', required: false },
        annee: { type: Number }
    }],

    grade: { type: mongoose.Schema.Types.ObjectId, ref: 'Grade', required: false },
    categorie: { type: mongoose.Schema.Types.ObjectId, ref: 'Categorie', required: false },
    fonction: { type: mongoose.Schema.Types.ObjectId, ref: 'Fonction', required: false },
    service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: false },
    commune: { type: mongoose.Schema.Types.ObjectId, ref: 'Commune', required: false },
    specialite: { type: mongoose.Schema.Types.ObjectId, ref: 'Specialite', required: false },


    // 
    // info pour reset le mot de passe
    verification: {
        code: { type: String, default: null },
        expirationDate: { type: Date, default: null },
    },

});

const User = mongoose.model('User', userSchema, 'users');

export default User;
