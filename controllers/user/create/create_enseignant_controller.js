import bcrypt from "bcrypt";
import { DateTime } from "luxon";
import User from '../../../models/user.model.js';
import { message } from '../../../configs/message.js';
import { appConfigs } from "../../../configs/app_configs.js";
import mongoose from 'mongoose';
import { sendPasswordOnEmail } from "../../../utils/send_password_on_email.js";

export const createEnseignantController = async (req, res) => {
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
        abscence,
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
        if (abscence) {
            if (!mongoose.Types.ObjectId.isValid(grade)) {
                return res.status(400).json({
                    success: false,
                    message: message.grade_invalide,
                });
            }
        }

        // veriifer le grade
        if (grade) {
            if (!mongoose.Types.ObjectId.isValid(grade)) {
                return res.status(400).json({
                    success: false,
                    message: message.grade_invalide,
                });
            }
        }

        // veriifer la categories
        if (categorie) {
            if (!mongoose.Types.ObjectId.isValid(categorie)) {
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
            if (!mongoose.Types.ObjectId.isValid(commune)) {
                return res.status(400).json({
                    success: false,
                    message: message.commune_invalide,
                });
            }
        }



        const role = appConfigs.role.enseignant;
        // mot de psase par defaut
        const mot_de_passe = process.env.DEFAULT_ENSEIGNANT_PASSWORD;

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


        const newEnseignant = await newUser.save();
        sendPasswordOnEmail(newEnseignant.nom, newEnseignant.email, mot_de_passe);


        const userData = newEnseignant.toObject();
        delete userData.mot_de_passe;
        res.json({
            success: true,
            message: message.creation_reuissi,
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
