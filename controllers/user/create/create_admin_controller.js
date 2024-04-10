import bcrypt from "bcrypt";
import { DateTime } from "luxon";
import User from '../../../models/user.model.js';
import { message } from '../../../configs/message.js';
import { appConfigs } from "../../../configs/app_configs.js";
import mongoose from 'mongoose';
import { sendPasswordOnEmail } from "../../../utils/send_password_on_email.js";

export const createAdminController = async (req, res) => {
    const {
        // info obligatoire
        nom,
        genre,
        email,

        // autre info necessaire
        photo_profil,
        contact,
        matricule,
        prenom,
        date_naiss,
        lieu_naiss,
        date_entree,

        // autres (object Id)
        grade,
        categorie,
        fonction,
        service,
        region,
        departement,
        commune,

    } = req.body;

    try {

        if (!email) {
            return res.status(400).json({
                success: false,
                message: message.emailRequis,
            });
        } else {
            // Vérifier si l'utilisateur existe déjà avec cet e-mail
            const existingUserWithEmail = await User.findOne({ email });

            if (existingUserWithEmail) {
                return res.status(400).json({
                    success: false,
                    message: message.emailExiste,
                });
            }
        }


        // veriifer le grade
        if (grade) {
            if (!mongoose.Types.ObjectId.isValid(grades)) {
                return res.status(400).json({
                    success: false,
                    message: message.grade_invalide,
                });
            }
        }

        // veriifer la categories
        if (categorie) {
            if (!mongoose.Types.ObjectId.isValid(categories)) {
                return res.status(400).json({
                    success: false,
                    message: message.categorie_invalide,
                });
            }
        }

        // veriifer la fonction
        if (fonction) {
            if (!mongoose.Types.ObjectId.isValid(fonction)) {
                return res.status(400).json({
                    success: false,
                    message: message.fonction_invalide,
                });
            }
        }

        // veriifer le service
        if (service) {
            if (!mongoose.Types.ObjectId.isValid(service)) {
                return res.status(400).json({
                    success: false,
                    message: message.service_invalide,
                });
            }
        }

        // veriifer la region
        if (region) {
            if (!mongoose.Types.ObjectId.isValid(region)) {
                return res.status(400).json({
                    success: false,
                    message: message.region_invalide,
                });
            }
        }

        // veriifer le departement
        if (departement) {
            if (!mongoose.Types.ObjectId.isValid(departement)) {
                return res.status(400).json({
                    success: false,
                    message: message.departement_invalide,
                });
            }
        }

        // veriifer la commune
        if (commune) {
            if (!mongoose.Types.ObjectId.isValid(communes)) {
                return res.status(400).json({
                    success: false,
                    message: message.commune_invalide,
                });
            }
        }



        const role = appConfigs.role.admin;
        // mot de psase par defaut
        const mot_de_passe = process.env.DEFAULT_ADMIN_PASSWORD;

        const saltRounds = 10; // Nombre de tours pour le hachage
        const hashedPassword = await bcrypt.hash(mot_de_passe, saltRounds);

        const currentDate = DateTime.now();

        // Créer un nouvel utilisateur avec tous les champs fournis
        const newUser = new User({
            roles: [role],
            nom,
            genre,
            email,
            //
            photo_profil,
            contact,
            matricule,
            prenom,
            date_creation: currentDate,
            date_naiss,
            lieu_naiss,
            date_entree,

            //
            historique_connexion: [],
            mot_de_passe: hashedPassword,

            // object Id
            grade,
            categorie,
            fonction,
            service,
            region,
            departement,
            commune,
        });


        const user = await newUser.save();

        try {
            await sendPasswordOnEmail(user.nom, user.email, mot_de_passe);
        } catch (error) {
            console.error("Erreur lors de l'envoi de l'e-mail:", error);
            // return res.status(500).json({
            //     success: false,
            //     message: {
            //         fr: "Une erreur est survenue lors de l'envoi de l'e-mail.",
            //         en: "An error occurred while sending the email."
            //     }
            // });
        }

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
