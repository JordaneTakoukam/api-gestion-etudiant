import User from '../../../models/user.model.js';
import { message } from '../../../configs/message.js';
import { appConfigs } from "../../../configs/app_configs.js";
import mongoose from 'mongoose';
import { sendPasswordOnEmail } from "../../../utils/send_password_on_email.js";
import bcrypt from "bcrypt";
import { DateTime } from "luxon";
import Absences from '../../../models/absence.model.js';

export const createEtudiant = async (req, res) => {
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
        abscences,
        niveaux,

        grade,
        categorie,
        fonction,
        service,
        commune,

    } = req.body;

    try {

        // Vérifier que tous les champs obligatoires sont présents
        if (!nom || !niveaux || !email || !genre) {
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
                    message: message.etudiant_existe,
                });
            }
        }

        if (abscences) {
            for (const absence of abscences) {
                if (!mongoose.Types.ObjectId.isValid(absence)) {
                    return res.status(400).json({
                        success: false,
                        message: message.absence_invalide,
                    });
                }
            }
        }

        // verifier si le niveau
        if (niveaux) {
            for (const niveau of niveaux) {
                if (!mongoose.Types.ObjectId.isValid(niveau.niveau)) {
                    return res.status(400).json({
                        success: false,
                        message: message.niveau_invalide,
                    });
                }
            }
        }


        // vérifier le grade
        if (grade) {
            if (!mongoose.Types.ObjectId.isValid(grade)) {
                return res.status(400).json({
                    success: false,
                    message: message.grade_invalide,
                });
            }
        }

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



        const role = appConfigs.role.etudiant;
        // mot de psase par defaut
        const mot_de_passe = process.env.DEFAULT_USERS_PASSWORD

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
            abscences,
            niveaux,

            grade,
            categorie,
            fonction,
            service,
            commune,
        });


        const newEtudiant = await newUser.save();


        const userData = newEtudiant.toObject();
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

export const updateEtudiant = async (req, res) => {
    const {etudiantId}=req.params;
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
        abscences,
        niveaux,

        grade,
        categorie,
        fonction,
        service,
        commune,

    } = req.body;

    try {

        // Vérifier que tous les champs obligatoires sont présents
        if (!nom || !niveaux || !email || !genre) {
            return res.status(400).json({ success: false, message: message.champ_obligatoire });
        }

        if (!mongoose.Types.ObjectId.isValid(etudiantId)) {
            return res.status(400).json({ 
                success: false, 
                message: message.identifiant_invalide
            });
        }

        
        // Vérifier si l'étudiant à modifier existe dans la base de données
        const existingEtudiant = await User.findById(etudiantId);
        if (!existingEtudiant) {
            return res.status(404).json({ 
                success: false, 
                message: message.etudiant_non_trouvee
            });
        }

        
        if(existingEtudiant.email!==email){
            const existingUserWithEmail = await User.findOne({ email });
            if (existingUserWithEmail) {
                return res.status(400).json({
                    success: false,
                    message: message.emailExiste,
                });
            }
        }
            
        //vérifier si le matricule exite déjà
        if (existingEtudiant.matricule !== matricule) {
            const existingMatricule = await User.findOne({ matricule });
            if (existingMatricule) {
                return res.status(400).json({
                    success: false,
                    message: message.etudiant_existe,
                });
            }
        }

        if (abscences) {
            for (const absence of abscences) {
                if (!mongoose.Types.ObjectId.isValid(absence)) {
                    return res.status(400).json({
                        success: false,
                        message: message.absence_invalide,
                    });
                }
            }
        }

        // verifier si le niveau
        if (niveaux) {
            for (const niveau of niveaux) {
                if (!mongoose.Types.ObjectId.isValid(niveau.niveau)) {
                    return res.status(400).json({
                        success: false,
                        message: message.niveau_invalide,
                    });
                }
            }
        }


        // vérifier le grade
        if (grade) {
            if (!mongoose.Types.ObjectId.isValid(grade)) {
                return res.status(400).json({
                    success: false,
                    message: message.grade_invalide,
                });
            }
        }

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


        // Créer un nouvel utilisateur avec tous les champs fournis
        existingEtudiant.nom = nom;
        existingEtudiant.prenom = prenom;
        existingEtudiant.matricule = matricule;
        existingEtudiant.niveaux = niveaux;
        existingEtudiant.email = email;
        existingEtudiant.genre = genre;
        existingEtudiant.date_naiss = date_naiss;
        existingEtudiant.lieu_naiss = lieu_naiss;
        existingEtudiant.photo_profil = photo_profil;
        existingEtudiant.contact = contact;
        existingEtudiant.date_entree = date_entree;
        existingEtudiant.grade = grade;
        existingEtudiant.categorie = categorie;
        existingEtudiant.fonction = fonction;
        existingEtudiant.service = service;
        existingEtudiant.commune = commune;

        const updateEtudiant = await existingEtudiant.save();
        const userData = updateEtudiant.toObject();
        delete userData.mot_de_passe;
        res.json({
            success: true,
            message: message.mis_a_jour,
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

export const deleteEtudiant = async (req, res) => {
    const { etudiantId } = req.params;

    try {
        // Vérifier si l'ID de la etudiant est un ObjectId valide
        if (!mongoose.Types.ObjectId.isValid(etudiantId)) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide
            });
        }

        // Supprimer tous les chapitres liés à la matière
        await Absences.deleteMany({ etudiant: etudiantId });
        
        // Supprimer la etudiant par son ID
        const deletedEtudiant = await User.findByIdAndDelete(etudiantId);
        if (!deletedEtudiant) {
            return res.status(404).json({
                success: false,
                message: message.etudiant_non_trouvee
            });
        }

        res.json({
            success: true,
            message: message.supprimer_avec_success
        });
    } catch (error) {
        console.error("Erreur interne au serveur :", error);
        res.status(500).json({
            success: false,
            message: message.erreurServeur
        });
    }
}


export const getEtudiantsByLevelAndYear = async (req, res) => {
    const { niveauId } = req.params;
    const { annee, page = 1, pageSize = 10 } = req.query;
  
    try {
      // Vérifier si l'ID du niveau est un ObjectId valide
      if (!mongoose.Types.ObjectId.isValid(niveauId)) {
        return res.status(400).json({
          success: false,
          message: message.identifiant_invalide,
        });
      }
  
      const skip = (page - 1) * pageSize;
  
      // Construire la requête en utilisant $elemMatch pour correspondre exactement au niveau et à l'année dans 'niveaux'
      const query = {
        'niveaux': {
          $elemMatch: {
            niveau: niveauId,
            annee: Number(annee),
          },
        },
      };
  
      const etudiants = await User.find(query)
        .skip(skip)
        .limit(Number(pageSize));
  
      // Filtrer les niveaux qui ne correspondent pas au niveau et à l'année de recherche
    //   etudiants.forEach((etudiant) => {
    //     etudiant.niveaux = etudiant.niveaux.filter(
    //       (niveau) => niveau.niveau.toString() === niveauId && niveau.annee === Number(annee)
    //     );
    //   });
  
      const totalEtudiants = await User.countDocuments(query);
  
      res.json({
        success: true,
        data: {
          etudiants,
          currentPage: page,
          totalPages: Math.ceil(totalEtudiants / pageSize),
          totalItems: totalEtudiants,
          pageSize,
        },
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des étudiants :', error);
      res.status(500).json({ success: false, message: 'Une erreur est survenue sur le serveur.' });
    }
  };
  

export const getAllEtudiantsByLevelAndYear = async (req, res) => {
    const { niveauId} = req.params;
    const {annee} = req.query;

    try {

        // Vérifier si l'ID du niveau est un ObjectId valide
        if (!mongoose.Types.ObjectId.isValid(niveauId)) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide
            });
        }

        const query = {
            'niveaux': {
                $elemMatch: {
                niveau: niveauId,
                annee: Number(annee),
                },
            },
        };

        const etudiants = await User.find(query);

        // Filtrer les niveaux qui ne correspondent pas à l'année et au niveau de recherche
        // etudiants.forEach((etudiant) => {
        //     etudiant.niveaux = etudiant.niveaux.filter(
        //         (niveau) => niveau.niveau.toString() === niveauId && niveau.annee === Number(annee)
        //     );
        // });

        res.json({
            success: true,
            data: {
                etudiants,
                currentPage: 0,
                totalPages: 0,
                totalItems:0,
                pageSize:0
            },
            
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des étudiants :', error);
        res.status(500).json({ success: false, message: 'Une erreur est survenue sur le serveur.' });
    }
};

