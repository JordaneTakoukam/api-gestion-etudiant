import jwt from 'jsonwebtoken';
import User from '../../models/user.model.js';
import { message } from '../../configs/message.js';
import { statusCompte } from '../../configs/key_role.js';
import mongoose from 'mongoose';

export const verifyCodeAndSignIn = async (req, res) => {
    const { userId, code } = req.body;

    try {
        // Vérifier si userId est un ObjectID valide de mongoose
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: { fr: "L'identifiant utilisateur fourni n'est pas valide." }
            });
        }

        // Rechercher l'utilisateur avec cet ID
        const user = await User.findById(userId);

        if (!user) {
            return res.status(400).json({
                success: false,
                message: message.userNonTrouver,
            });
        }

        // Vérifier si le code de vérification correspond
        if (user.verification.code === code) {
            // Vérifier si le code n'a pas expiré
            const now = new Date();
            if (now > user.verification.expirationDate) {
                return res.status(400).json({
                    success: false,
                    message: {
                        fr: "Le code de vérification a expiré. Veuillez en générer un nouveau."
                    },
                });
            }

            // Le code de vérification est valide, générer un nouveau jeton JWT
            const token = jwt.sign(
                {
                    userId: user._id,
                    role: user.role,
                    email: user.email,
                    nom_et_prenom: user.nom_et_prenom,
                    statut: statusCompte.verifier,
                },
                process.env.JWT_KEY,
                { expiresIn: process.env.JWT_EXPIRATION_DATE || '1d' }
            );

            // Mettre à jour l'historique de connexion de l'utilisateur
            user.historique_connexion.push(now);
            user.statut = statusCompte.verifier;

            await user.save();

            // Retourner les données de l'utilisateur avec le nouveau jeton
            const userData = user.toObject();
            delete userData.mot_de_passe;

            return res.json({
                success: true,
                message: { fr: "Connexion réussie!", },
                token,
                data: userData,
            });
        } else {
            // Le code de vérification ne correspond pas
            return res.status(400).json({
                success: false,
                message: { fr: "Code de vérification incorrect!", }
            });
        }

    } catch (error) {
        console.error("Erreur :", error);
        return res.status(500).json({
            success: false,
            message: message.erreurServeur
        });
    }
};
