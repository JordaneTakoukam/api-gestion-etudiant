import User from './../../models/user.model.js'
import bcrypt from "bcrypt";
import { DateTime } from "luxon";
import { message } from '../../configs/message.js';
import jwt from 'jsonwebtoken';

// connexion
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
                    nom: user.nom,
                    prenom: user.prenom,
                },
                process.env.JWT_KEY,
                { expiresIn: process.env.JWT_EXPIRATION_DATE || '1d' }
            );

            // Mettre à jour l'historique de connexion de l'utilisateur
            user.historique_connexion.push(DateTime.now());
            await user.save();

            // on retourne tous sauf le mot de passe
            const userData = user.toObject();
            delete userData.mot_de_passe;

            res.json({
                success: true,
                message: message.connexionReussie,
                token,
                data: user,
            });
        } else {
            // Le mot de passe ne correspond pas
            res.status(401).json({
                success: false,
                message: message.motDePasseIncorrect
            });
        }
    }

    catch (e) { }
}


// changer le mot de passe
// changer le mot de passe
export const changePassword = async (req, res) => {
    const { userId, ancien_mdp, nouveau_mdp } = req.body;

    try {
        // Récupérer l'utilisateur par son ID
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: message.userNonTrouver,
            });
        }

        // Vérifier si l'ancien mot de passe correspond
        const passwordMatch = await bcrypt.compare(ancien_mdp, user.mot_de_passe);
        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: message.motDePasseIncorrect,
            });
        }

        // Hasher le nouveau mot de passe
        const hashedPassword = await bcrypt.hash(nouveau_mdp, 10);

        // Mettre à jour le mot de passe de l'utilisateur
        user.mot_de_passe = hashedPassword;
        await user.save();

        res.json({
            success: true,
            message: message.success_changer_mdp,

        });

    } catch (error) {
        console.error("Erreur lors du changement de mot de passe :", error);
        res.status(500).json({
            success: false,
            message: message.erreurServeur,
        });
    }
};



// reset password
export const resetPassword = async (req, res) => { }


