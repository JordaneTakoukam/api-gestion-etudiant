import User from '../../../models/user.model.js';
import { message } from '../../../configs/message.js';
import { appConfigs } from "../../../configs/app_configs.js";

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
