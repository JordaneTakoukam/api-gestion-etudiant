import bcrypt from "bcrypt";
import { DateTime } from "luxon";
import User from '../../../models/user.model.js';
import { message } from '../../../configs/message.js';
import { appConfigs } from "../../../configs/app_configs.js";
import mongoose from 'mongoose';
import { sendPasswordOnEmail } from "../../../utils/send_password_on_email.js";
import { readFileSync } from 'fs';


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
        // abscences,
        // niveaux,

        // grade,
        categorie,
        fonction,
        service,
        commune,

    } = req.body;

    try {

        // Vérifier que tous les champs obligatoires sont présents
        if (!nom || !email || !genre) {
            return res.status(400).json({ success: false, message: message.champ_obligatoire });
        }

        
        // Vérifier si l'utilisateur existe déjà avec cet e-mail
        const existingUserWithEmail = await User.findOne({ email });

        if (existingUserWithEmail) {
            return res.status(400).json({
                success: false,
                message: message.emailExiste,
            });
        }

        //vérifier si le matricule exite déjà
        if(matricule){
            const existingMatricule = await User.findOne({ matricule });

            if (existingMatricule) {
                return res.status(400).json({
                    success: false,
                    message: message.enseignant_existe,
                });
            }
        }


        // vérifier le grade
        // if (grade) {
        //     if (!mongoose.Types.ObjectId.isValid(grade)) {
        //         return res.status(400).json({
        //             success: false,
        //             message: message.grade_invalide,
        //         });
        //     }
        // }

        // vérifier le service
        if (service) {
            if (!mongoose.Types.ObjectId.isValid(service)) {
                return res.status(400).json({
                    success: false,
                    message: message.service_invalide,
                });
            }
        }

        //vérifier la catégorie
        if (categorie) {
            if (!mongoose.Types.ObjectId.isValid(categorie)) {
                return res.status(400).json({
                    success: false,
                    message: message.categorie_invalide,
                });
            }
        }

        //vérifier la fonction
        if (fonction) {
            if (!mongoose.Types.ObjectId.isValid(fonction)) {
                return res.status(400).json({
                    success: false,
                    message: message.fonction_invalide,
                });
            }
        }

        // vérifier la commune
        if (commune) {
            if (!mongoose.Types.ObjectId.isValid(commune)) {
                return res.status(400).json({
                    success: false,
                    message: message.commune_invalide,
                });
            }
        }



        const role = appConfigs.role.admin;
        // mot de psase par defaut
        const mot_de_passe = process.env.DEFAULT_ENSEIGNANT_PASSWORD

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


            categorie,
            fonction,
            service,
            commune,
        });


        const newEnseignant = await newUser.save();


        const userData = newEnseignant.toObject();
        sendPasswordOnEmail(userData.nom, userData.email, mot_de_passe);
        delete userData.mot_de_passe;
        
        res.json({
            success: true,
            message: message.ajouter_avec_success,
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

async function lireDonneesFichierCSV(niveau, fichier) {
    
    // // Structure pour stocker les données
    const donnees = [];
    const mot_de_passe = process.env.DEFAULT_ADMIN_PASSWORD

    const saltRounds = 10; // Nombre de tours pour le hachage
    const hashedPassword = await bcrypt.hash(mot_de_passe, saltRounds);
    try {
        // Lire le fichier texte de manière synchrone
        const data = readFileSync(fichier, 'utf8');
        
    
        // // Split data into lines
        const lines = data.split('\n');
        lines.forEach((line, index) => {
        line = line.split(';');
        

        const currentDate = DateTime.now();
        
        if (line.length === 0) return;

           
            let currentStudent = {
                nom: line[0].trim(),
                prenom:line[1].trim(),
                mot_de_passe:hashedPassword,
                genre:line[2].trim(),
                roles:[appConfigs.role.admin],
                // niveaux:[{niveau:niveau, annee:2023}],
                email:line[3].replace('\r', "").trim(),
                date_creation:currentDate
            };

            donnees.push(currentStudent);
            
    });
    
      } catch (err) {
        console.error('Erreur lors de la lecture du fichier:', err);
      }
    
    
    return donnees;
}

export const createManyAdmin = async (req, res) => {
    try {
        const filePath = './liste_admin.csv';
        const niveau="665c40a406d18fba0d8236ae";
        const donnees = await lireDonneesFichierCSV(niveau,filePath);
        const result = await User.insertMany(donnees);
        res.status(201).json({ success: true, message: "Ajouté avec succès", data: result });
        

    } catch(e) {
        console.log(e);
    }
}
