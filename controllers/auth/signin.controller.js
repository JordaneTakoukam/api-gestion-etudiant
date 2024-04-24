import bcrypt from "bcrypt";
import { DateTime } from "luxon";
import jwt from 'jsonwebtoken';
import User from '../../models/user.model.js';
import { message } from '../../configs/message.js';
import { keyRoleApp } from '../../configs/key_role.js'


export const signin = async (req, res) => {
    const { email, mot_de_passe } = req.body;

    try {
        // Vérifier si l'utilisateur existe déjà avec cet e-mail
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: message.userNonTrouver,
            });
        }

        // Vérifier si le mot de passe est correct
        const passwordMatch = await bcrypt.compare(mot_de_passe, user.mot_de_passe);

        if (passwordMatch) {
            // Le mot de passe est correct, générez un jeton JWT
            const token = jwt.sign(
                {
                    userId: user._id,
                    role: user.role,
                    nom_et_prenom: user.nom_et_prenom,
                },
                process.env.JWT_KEY,
                { expiresIn: process.env.JWT_EXPIRATION_DATE || '1d' }
            );

            // Mettre à jour l'historique de connexion de l'utilisateur
            user.historique_connexion.push(new Date());
            await user.save();

            // on retourne tous sauf le mot de passe
            const userData = user.toObject();
            delete userData.mot_de_passe;



            res.json({
                success: true,
                message: "Connexion réussie!",
                token,
                data: userData,
            });
        } else {
            // Le mot de passe ne correspond pas
            res.status(401).json({
                success: false,
                message: "Mot de passe incorrect!",
            });
        }

    } catch (error) {
        console.error("Erreur :", error);
        res.status(500).json({
            success: false,
            message: message.erreurServeur
        });
    }
};


// reset le mot de passe
export const resetPassword = async (req, res) => { }






