import bcrypt from "bcrypt";
import { DateTime } from "luxon";
import jwt from 'jsonwebtoken';
import User from '../../../models/user.model.js';
import { message } from '../../../configs/message.js';
import { appConfigs } from "../../../configs/app_configs.js";
import mongoose from 'mongoose';

export const createUser = async (req, res) => {
    const {
        role,
        nom,
        genre,
        email,
        section,
        cycle,
        niveau,
        // info facultative

        contact,
        photo_profil,
        matricule,
        prenom,
        date_naiss,
        lieu_naiss,
        grades,
        categories,
        fonction,
        service,
        region,
        departement,
        communes,
        date_entree,
    } = req.body;

    try {
        var abscence = null;

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




        // Vérifier si des champs spécifiques sont requis pour certains rôles
        if (role === appConfigs.role.etudiant || role === appConfigs.role.delegue) {

            if (!section) {
                return res.status(400).json({
                    success: false,
                    message: message.section_manquante,
                });
            } else {
                // Vérifier si le service est un ObjectId valide
                if (!mongoose.Types.ObjectId.isValid(section)) {
                    return res.status(400).json({
                        success: false,
                        message: message.section_invalide,
                    });
                }


            }
            if (!cycle) {
                return res.status(400).json({
                    success: false,
                    message: message.cycle_manquant,
                });
            } else {
                // Vérifier si le cycle est un ObjectId valide
                if (!mongoose.Types.ObjectId.isValid(cycle)) {
                    return res.status(400).json({
                        success: false,
                        message: message.cycle_invalide,
                    });
                }


            }
            if (!niveau) {
                return res.status(400).json({
                    success: false,
                    message: message.niveau_manquant,
                });
            } else {
                // Vérifier si le niveau est un ObjectId valide
                if (!mongoose.Types.ObjectId.isValid(niveau)) {
                    return res.status(400).json({
                        success: false,
                        message: message.niveau_invalide,
                    });
                }
            }
        }



        // initialisation des abscence 
        if (role === appConfigs.role.etudiant || role === appConfigs.role.delegue || role === appConfigs.role.enseignant) {
            abscence = {
                date_abscence: null,
                heure_debut: null,
                heure_fin: null,
                semestre: null,
                annee: null,
            };
        }


        // mot de psase par defaut
        const mot_de_passe = process.env.DEFAULT_USERS_PASSWORD;


        const saltRounds = 10; // Nombre de tours pour le hachage
        const hashedPassword = await bcrypt.hash(mot_de_passe, saltRounds);

        const currentDate = DateTime.now();

        // Créer un nouvel utilisateur avec tous les champs fournis
        const newUser = new User({
            matricule,
            roles: [role],
            date_creation: currentDate,
            nom,
            prenom,
            date_naiss,
            lieu_naiss,
            genre,
            email,
            contact,

            section,
            cycle,
            niveau,
            grades,
            categories,
            fonction,
            service,
            region,
            departement,
            communes,
            date_entree,
            photo_profil,
            mot_de_passe: hashedPassword,
            abscences: abscence ? [abscence] : [],
            historique_connexion: [],
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

export const getUsersWithRole = async (req, res) => {
    const role = req.params
    try {
        // Récupérer la liste des utilisateurs ayant le rôle enseignant
        const users = await User.find({ roles: { $in: ['enseignant'] } });
        console.log(users);
        res.status(200).json({ 
            success: true, 
            data: {users }
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des enseignants :', error);
        res.status(500).json({ success: false, message: 'Erreur serveur lors de la récupération des enseignants' });
    }
};
