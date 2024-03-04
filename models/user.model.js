import mongoose, { Schema } from 'mongoose';
import { keyRoleApp } from '../configs/key_role.js';

const validRoles = [
    keyRoleApp.superAdmin,
    keyRoleApp.admin,
    keyRoleApp.enseignant,
    keyRoleApp.delegue,
    keyRoleApp.etudiant
];

const userSchema = new Schema({
    role: { type: String, required: true },
    dateCreation: { type: Date, required: true },
    commune: { type: String, default: null },
    categorie: { type: String, default: null  },
    service: { type: String, default: null },
    grade: { type: String, default: null },
    matricule: { type: String, default: null },
    nom: { type: String, required: true },
    prenom: { type: String, default: null },
    genre: { type: String, required: true },
    dateNaiss: { type: Date, default: null },
    lieuNaiss: { type: String, default: null },
    contact: { type: String, default: null },
    email: { type: String, required: true },
    motDePasse: { type: String, required: true }
});

const User = mongoose.model('User', userSchema, 'users');

export default User;
