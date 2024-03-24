import jwt from 'jsonwebtoken';
import { message } from '../../configs/message.js';
import User from './../../models/user.model.js';

// Créer un nouveau jeton JWT en fonction du rôle et de l'identifiant de l'utilisateur
export const NewJWT = async (req, res) => {
    const { userId, role } = req.body;

    try {
        // Récupérer l'utilisateur par son ID
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: message.userNonTrouver,
            });
        }

        // Vérifier si le rôle envoyé existe dans les rôles de l'utilisateur
        if (!user.roles.includes(role)) {
            return res.status(403).json({
                success: false,
                message: message.roleAccesNonAutoriser,
            });
        }

        // Générer un nouveau jeton JWT avec le rôle et l'identifiant de l'utilisateur
        const token = jwt.sign(
            {
                userId: user._id,
                roles: user.roles,
                role: role,
                nom: user.nom,
                prenom: user.prenom,
            },
            process.env.JWT_KEY,

            { expiresIn: process.env.JWT_EXPIRATION_DATE || '1d' }
        );

        // on retourne tous sauf le mot de passe
        const userData = user.toObject();
        delete userData.mot_de_passe;

        res.json({
            success: true,
            message: message.connexionReussie,
            token,
            data: userData,
        });

    } catch (error) {
        console.error("Erreur lors de la création d'un nouveau jeton JWT :", error);
        res.status(500).json({
            success: false,
            message: message.erreurServeur,
        });
    }
};
