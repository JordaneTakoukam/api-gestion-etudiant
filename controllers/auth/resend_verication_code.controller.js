import jwt from 'jsonwebtoken';
import User from '../../models/user.model.js';
import { message } from '../../configs/message.js';

export const resendVerificationCode = async (req, res) => {
    const { email } = req.body;

    try {
        // Rechercher l'utilisateur avec cet e-mail
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: message.userNonTrouver,
            });
        }

        // Génération d'un nouveau code de vérification
        const newVerificationCode = generateVerificationCode();

        // Définition de la nouvelle date d'expiration (24 heures à partir de maintenant)
        const newExpirationDate = setExpirationDate();

        // Mettre à jour le code de vérification et la date d'expiration dans la base de données
        user.verification.code = newVerificationCode;
        user.verification.expirationDate = newExpirationDate;
        await user.save();


        try {

            await sendVerificationCodeByEmail(user.nom_et_prenom, user.email, user.verification.code);

            // generation du jwt
            const playload = {
                userId: user._id,
                role: user.role,
                email: user.email,
                nom_et_prenom: user.nom_et_prenom,
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
                    fr: "Un nouveau code de vérification a été envoyé à votre adresse e-mail.",
                    en: ""
                },
            });

        } catch (e) {
            console.log(e);
            res.status(500).json({
                success: false,
                message: message.erreurServeur,
                token: token,
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
