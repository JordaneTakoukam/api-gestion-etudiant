import User from '../../models/user.model.js'
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
                    roles: user.roles,
                    role: user.roles[0],
                    nom: user.nom,
                    prenom: user.prenom,
                    genre: user.genre,
                    email: user.email,
                    photo_profil: user.photo_profil,
                    contact: user.contact,
                    matricule: user.matricule,
                    date_naiss: user.date_naiss,
                    lieu_naiss: user.lieu_naiss,
                    date_entree: user.date_entree,
                    absences: user.absences,
                    niveaux: user.niveaux,
                    categorie: user.categorie,
                    fonction: user.fonction,
                    service: user.service,
                    commune: user.commune,
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
                data: userData,
            });
        } else {
            // Le mot de passe ne correspond pas
            res.status(401).json({
                success: false,
                message: message.motDePasseIncorrect
            });
        }
    }

    catch (e) {
        console.error("Erreur interne au serveur : "+e);
        res.status(500).json({
            success: false,
            message: message.erreurServeur,
        });
    }
}

