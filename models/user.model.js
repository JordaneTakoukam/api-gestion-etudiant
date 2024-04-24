import mongoose, { Schema } from 'mongoose';
import { keyRoleApp, statusCompte } from '../configs/key_role.js';
import { ObjectId } from 'mongodb';

const validRoles = [
  keyRoleApp.superAdmin,
  keyRoleApp.admin,
  keyRoleApp.user,
];

const userSchema = new Schema({
  role: {
    type: String,
    required: true,
    default: keyRoleApp.user,
    validate: {
      validator: function (v) {
        return validRoles.includes(v);
      },
      message: (props) => `${props.value} n'est pas un rôle valide`,
    },
  },
  nom_et_prenom: { type: String, required: true },
  email: { type: String, required: true, unique: true }, // Add unique constraint
  mot_de_passe: { type: String, required: true }, // Consider using password hashing
  contact: { type: String, default: '' },
  statut: { type: String, default: statusCompte.non_verifier },
  date_creation: { type: Date, default: Date.now() },
  historique_connexion: [{ type: Date, default: null }],

  verification: {
    code: { type: String, required: true },
    expirationDate: { type: Date, required: true },
  },

  abonnement: {
    label: { type: String, default: '' },
    date_debut: { type: Date, default: null },
    date_fin: { type: Date, default: null },
    id_abonnement: { type: ObjectId, default: null },
  },
});

const User = mongoose.model('User', userSchema, 'users');

export default User;
