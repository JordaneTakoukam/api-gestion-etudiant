import bcrypt from "bcrypt";
import { DateTime } from "luxon";
import jwt from 'jsonwebtoken';
import User from '../../../models/user.model.js';
import { message } from '../../../configs/message.js';
import { keyRoleApp } from '../../../configs/key_role.js'


export const createDefaultSuperAdmin = async (req, res) => {
    const data = {
        nom: 'super',
        prenom: 'admin',
        email: 'takoukam.jordane@gmail.com',
        role: 'super-admin',
        genre: 'm'
    }

    try {
        // Vérifier s'il existe un compte super-admin
        const existingSuperAdmin = await User.findOne({ role: keyRoleApp.superAdmin });

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


        let passwordGenerate = 'SuperAdmin'
        console.log('Mot de passe = ', passwordGenerate);

        let role = keyRoleApp.superAdmin;

        // Hash du mot de passe
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(passwordGenerate, saltRounds);
        const currentDate = DateTime.now();

        // Créer un nouvel utilisateur
        const newUser = new User({
            email: data.email,
            nom: data.nom,
            prenom: data.prenom,
            role: role,
            genre: data.genre,
            motDePasse: hashedPassword,
            dateCreation: currentDate,

        });

        const user = await newUser.save();

        const playload = {
            "test": "test"
            // cId: user._id,
            // lId: user.loginId,
            // r: user.role,
        }
        // Générer un jeton JWT
        const token = jwt.sign(
            playload,
            process.env.JWT_KEY,
            { expiresIn: process.env.JWT_EXPIRATION_DATE || '1d' }
        );

        // on retourne tous sauf le mot de passe
        const userData = user.toObject();
        delete userData.motDePasse;

        res.json({
            success: true,
            message: message.inscriptReuissie,
            token,
            data: userData,
            id: userData._id
        });

    } catch (error) {
        console.error("Erreur :", error);
        res.status(500).json({
            success: false,
            message: message.erreurServeur
        });
    }
};

