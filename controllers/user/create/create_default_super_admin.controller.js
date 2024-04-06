import bcrypt from "bcrypt";
import { DateTime } from "luxon";
import User from '../../../models/user.model.js';
import { message } from '../../../configs/message.js';
import { appConfigs } from '../../../configs/app_configs.js'


export const createDefaultSuperAdmin = async (req, res) => {
    const data = {
        nom: appConfigs.defaultSuperUser.nom,
        prenom: appConfigs.defaultSuperUser.prenom,
        email: appConfigs.defaultSuperUser.email,
        genre: appConfigs.defaultSuperUser.genre,
    }

    try {
        // Vérifier s'il existe un compte super-admin
        // Récupérer l'utilisateur par son ID
        const existingSuperAdmin = await User.findOne({ roles: { $in: [appConfigs.role.superAdmin] } });

        if (existingSuperAdmin) {
            return res.status(400).json({
                success: false,
                message: message.superAdminDejaExistant,
            });
        }

        // Vérifier si l'utilisateur existe déjà avec cet e-mail
        const existingUserWithEmail = await User.findOne({ email: data.email });

        if (existingUserWithEmail) {
            return res.status(400).json({
                success: false,
                message: message.emailExiste,
            });
        }

        const passwordGenerate = process.env.DEFAULT_SUPER_ADMIN_PASSWORD;

        // Hash du mot de passe
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(passwordGenerate, saltRounds);
        const currentDate = DateTime.now();

        // Créer un nouvel utilisateur
        const newUser = new User({
            roles: [appConfigs.role.superAdmin],
            genre: data.genre,
            email: data.email,
            nom: data.nom,
            prenom: data.prenom,
            date_creation: currentDate,
            mot_de_passe: hashedPassword,
        });

        await newUser.save();

        res.json({
            success: true,
            message: message.creation_reuissi,
        });

    } catch (error) {
        console.error("Erreur :", error);
        res.status(500).json({
            success: false,
            message: message.erreurServeur
        });
    }
};

