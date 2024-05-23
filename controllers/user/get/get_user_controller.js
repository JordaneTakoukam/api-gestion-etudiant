import User from '../../../models/user.model.js';
import { message } from '../../../configs/message.js';
import { appConfigs } from "../../../configs/app_configs.js";
import mongoose from 'mongoose';

export const getCurrentUserData = async (req, res) => {
    const { userId } = req.query;

    if (!userId) {
        return res.status(400).json({
            success: false,
            message: {
                fr: "Identifiant requis",
                en: "User ID is required"
            }
        });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({
            success: false,
            message: message.identifiant_invalide
        });
    }

    try {
        const user = await User.findById(userId, '-historique_connexion -mot_de_passe -date_creation -verificationCode -__v').lean();

        if (!user) {
            return res.status(404).json({
                success: false,
                message: {
                    fr: "L'utilisateur n'existe pas",
                    en: "User does not exist"
                }
            });
        }

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error("Erreur lors de la récupération de l'utilisateur :", error);
        res.status(500).json({
            success: false,
            message: {
                fr: "Une erreur s'est produite lors de la récupération des données de l'utilisateur",
                en: "An error occurred while retrieving user data"
            }
        });
    }
};



// Fonction générique pour récupérer tous les utilisateurs d'un certain rôle
const getAllUsersByRole = async (req, res, role) => {
    const { page = 1, pageSize = 10 } = req.query; // Valeurs par défaut pour la pagination

    try {
        // Calculer l'indice de début pour la pagination
        const startIndex = (parseInt(page) - 1) * parseInt(pageSize);

        // Rechercher les utilisateurs avec le rôle spécifié avec pagination
        const users = await User.find({ roles: { $in: [role] } })
            .skip(startIndex)
            .limit(parseInt(pageSize));

        // Supprimer le champ "mot_de_passe" pour chaque utilisateur
        const userData = users.map(user => {
            const userData = user.toObject();
            delete userData.mot_de_passe;
            return userData;
        });

        // Compter le nombre total d'utilisateurs avec le rôle spécifié
        const totalUsers = await User.countDocuments({ roles: { $in: [role] } });

        // Envoyer la réponse avec les données paginées
        res.json({
            success: true,
            list: userData,
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalUsers / parseInt(pageSize)),
            totalItems: totalUsers,
            pageSize: parseInt(pageSize)
        });
    } catch (error) {
        console.error("Erreur interne au serveur :", error);
        res.status(500).json({
            success: false,
            message: message.erreurServeur,
        });
    }
}


export const getAllEtudiants = async (req, res) => {
    await getAllUsersByRole(req, res, appConfigs.role.etudiant);
}

export const getAllEnseignants = async (req, res) => {
    await getAllUsersByRole(req, res, appConfigs.role.enseignant);
}

export const getAllAdministrateurs = async (req, res) => {
    await getAllUsersByRole(req, res, appConfigs.role.admin);
}

