import bcrypt from "bcrypt";
import { DateTime } from "luxon";
import jwt from 'jsonwebtoken';
import User from '../../models/user.model.js';
import { message } from '../../configs/message.js';
import { generateConfirmationCode } from "../../fonctions/fonctions.js";
import { sendVerificationCodeByEmail } from "../../utils/send_code_verification.js";


function setExpirationDate() {
    return DateTime.now().plus({ days: 1 }).toJSDate();
}

// inscription
export const signup = async (req, res) => {
    const { nom_et_prenom, email, mot_de_passe } = req.body;

    try {

        // Vérifier si l'utilisateur existe déjà avec cet e-mail
        const existingUserWithEmail = await User.findOne({ email: email });

        if (existingUserWithEmail) {
            return res.status(400).json({
                success: false,
                message: message.emailExiste,
            });
        }


        // Hash du mot de passe
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(mot_de_passe, saltRounds);

        // Génération du code de vérification
        const codeDeVerification = generateConfirmationCode();

        // Définition de la date d'expiration
        const expirationDate = setExpirationDate();

        // Créer un nouvel utilisateur
        const newUser = new User({
            nom_et_prenom: nom_et_prenom,
            email: email,
            mot_de_passe: hashedPassword,
            historique_connexion: [],
            verification: {
                code: codeDeVerification,
                expirationDate: expirationDate,
            }
        });

        const user = await newUser.save();

        try {

            await sendVerificationCodeByEmail(user.nom_et_prenom, user.email, user.verification.code);

            // generation du jwt
            const playload = {
                userId: user._id,
                role: user.role,
                email: user.email,
                nom_et_prenom: user.nom_et_prenom,
                statut : user.statut,
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
                message: {
                    fr: "Un code de vérification vous a été envoyer par mail",
                    en: ""
                },
                token: token,

            });

        } catch (e) {
            console.log(e);
            res.status(500).json({
                success: false,
                message: message.erreurServeur,
            });
        }



    } catch (error) {
        console.error("Erreur :", error);
        res.status(500).json({
            success: false,
            message: message.erreurServeur
        });
    }
}