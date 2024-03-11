import bcrypt from "bcrypt";
import { DateTime } from "luxon";
import jwt from 'jsonwebtoken';
import User from '../../../models/user.model.js';
import { message } from '../../../configs/message.js';
import { appConfigs } from '../../../configs/app_configs.js'


export const createDefaultSuperAdmin = async (req, res) => {
    const data = {
        nom: appConfigs.defaultSuperUser.nom,
        prenom: appConfigs.defaultSuperUser.prenom,
        email: appConfigs.defaultSuperUser.email,
        role: appConfigs.role.superAdmin,
        genre: appConfigs.defaultSuperUser.genre,
    }

    try {
        // Vérifier s'il existe un compte super-admin
        const existingSuperAdmin = await User.findOne({ role: data.role });

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


        const passwordGenerate = appConfigs.defaultSuperUser.defautlPassword;

        // Hash du mot de passe
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(passwordGenerate, saltRounds);
        const currentDate = DateTime.now();

        // Créer un nouvel utilisateur
        const newUser = new User({
            email: data.email,
            nom: data.nom,
            prenom: data.prenom,
            role: data.role,
            genre: data.genre,
            mot_de_passe: hashedPassword,
            date_creation: currentDate,

        });

        const user = await newUser.save();

        const playload = {
            userId: user._id,
            role: user.role,
            nom: user.nom,
            prenom: user.prenom,
        }
        // Générer un jeton JWT
        const token = jwt.sign(
            playload,
            process.env.JWT_KEY,
            { expiresIn: process.env.JWT_EXPIRATION_DATE || '1d' }
        );

        // on retourne tous sauf le mot de passe
        const userData = user.toObject();
        delete userData.mot_de_passe;

        res.json({
            success: true,
            message: message.inscriptReuissie,
            token,
            data: userData,
        });

    } catch (error) {
        console.error("Erreur :", error);
        res.status(500).json({
            success: false,
            message: message.erreurServeur
        });
    }
};

