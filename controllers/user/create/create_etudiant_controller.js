import User from '../../../models/user.model.js';
import { message } from '../../../configs/message.js';
import { appConfigs } from "../../../configs/app_configs.js";
import mongoose from 'mongoose';
import { sendPasswordOnEmail } from "../../../utils/send_password_on_email.js";
import bcrypt from "bcrypt";
import { DateTime } from "luxon";
import Absences from '../../../models/absences/absence.model.js';
import Setting from '../../../models/setting.model.js';
import { formatDateFr, formatYear, generatePDFAndSendToBrowser, loadHTML } from '../../../fonctions/fonctions.js';
import cheerio from 'cheerio';
import { readFileSync } from 'fs';
import ExcelJS from 'exceljs';

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
        niveaux,

        categorie,
        fonction,
        service,
        commune,
        nationalite,
        diplomeEntre,
        specialite

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
        if (matricule) {
            const existingMatricule = await User.findOne({ matricule });

            if (existingMatricule) {
                return res.status(400).json({
                    success: false,
                    message: message.etudiant_existe,
                });
            }
        }

        // if (absences) {
        //     for (const absence of absences) {
        //         if (!mongoose.Types.ObjectId.isValid(absence)) {
        //             return res.status(400).json({
        //                 success: false,
        //                 message: message.absence_invalide,
        //             });
        //         }
        //     }
        // }

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

        if (specialite) {
            if (!mongoose.Types.ObjectId.isValid(specialite)) {
                return res.status(400).json({
                    success: false,
                    message: message.specialite_invalide,
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
            absences : [],
            niveaux,

            // grade,
            categorie,
            fonction,
            service,
            commune,
            nationalite,
            diplomeEntre,
            specialite
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
    const { etudiantId } = req.params;
    const {
        // info obligatoire
        nom,
        genre,
        email,
        roles,

        // autre info necessaire
        photo_profil,
        contact,
        matricule,
        prenom,
        date_naiss,
        lieu_naiss,
        date_entree,

        // autres (object Id)
        niveaux,

        // grade,
        categorie,
        fonction,
        service,
        commune,
        nationalite,
        diplomeEntre,
        specialite

    } = req.body;
    // console.log(roles);
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


        if (existingEtudiant.email !== email) {
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

        if (specialite) {
            if (!mongoose.Types.ObjectId.isValid(specialite)) {
                return res.status(400).json({
                    success: false,
                    message: message.specialite_invalide,
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
        // existingEtudiant.grade = grade;
        existingEtudiant.categorie = categorie;
        existingEtudiant.fonction = fonction;
        existingEtudiant.service = service;
        existingEtudiant.commune = commune;
        existingEtudiant.roles = roles;
        existingEtudiant.nationalite = nationalite;
        existingEtudiant.diplomeEntre = diplomeEntre;
        existingEtudiant.specialite = specialite;

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
            .sort({nom:1, prenom:1})
            .skip(skip)
            .limit(Number(pageSize));

        // Filtrer les niveaux qui ne correspondent pas au niveau et à l'année de recherche
          etudiants.forEach((etudiant) => {
            etudiant.niveaux = etudiant.niveaux.filter(
              (niveau) => niveau.niveau.toString() === niveauId && niveau.annee === Number(annee)
            );
          });

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

export const searchEtudiant = async (req, res) => {
    const role = appConfigs.role.etudiant;
    const { searchString, limit=5 } = req.params; // Récupère la chaîne de recherche depuis les paramètres de requête
    try {
        // Construire la requête de base pour filtrer les etudiants
        const query = {
            roles: { $in: [role] } // Filtrer les utilisateurs avec le rôle etudiant
        };

        // Ajouter une condition pour chercher par nom si searchString est fourni
        if (searchString) {
            query.nom = { $regex: `^${searchString}`, $options: 'i' }; // Filtrer par nom commençant par searchString, insensible à la casse
        }

        let etudiants = [];
        if(limit>5){
            etudiants = await User.find(query)
            // .select("_id nom prenom")
            .sort({ nom: 1, prenom:1 }) 
            .limit(limit);
        } else{
            etudiants = await User.find(query)
            .select("_id nom prenom")
            .sort({ nom: 1, prenom:1 }) 
            .limit(limit);
        }

        res.json({
            success: true,
            data: {
                etudiants,
                currentPage: 0,
                totalPages: 1,
                totalItems: etudiants.length,
                pageSize: 5,
            }
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des etudiants :', error);
        res.status(500).json({ success: false, message: 'Une erreur est survenue sur le serveur.' });
    }
};

export const getAllEtudiantsByLevelAndYear = async (req, res) => {
    const { niveauId } = req.params;
    const { annee } = req.query;

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

        const etudiants = await User.find(query).sort({nom:1, prenom:1});

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
                totalItems: 0,
                pageSize: 0
            },

        });
    } catch (error) {
        console.error('Erreur lors de la récupération des étudiants :', error);
        res.status(500).json({ success: false, message: 'Une erreur est survenue sur le serveur.' });
    }
};

export const getFindOneEtudiant = async (req, res) => {
    const { _id} = req.params;
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
            _id:_id,
            'niveaux': {
                $elemMatch: {
                
                annee: Number(annee),
                },
            },
        };

        const etudiants = await User.findOne(query);

        // Filtrer les niveaux qui ne correspondent pas à l'année et au niveau de recherche
        etudiants.forEach((etudiant) => {
            etudiant.niveaux = etudiant.niveaux.filter(
                (annee) => niveau.annee === Number(annee)
            );
        });

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

export const getTotalEtudiantsByYear = async (req, res) => {
    const {annee}=req.query;
    try {
        // Construire la requête en utilisant $elemMatch pour correspondre exactement à l'année dans 'niveaux'
        let role = appConfigs.role.etudiant;
        const query = {
            roles: { $in: [role] },
            niveaux: {
                $elemMatch: { annee: annee }
            }
        };

        const etudiants = await User.find(query);
        
        const totalEtudiants = etudiants.length;
        res.json({
            success: true,
            data: totalEtudiants,
            
        });
        
    } catch (error) {
        console.error('Erreur lors de la récupération des étudiants :', error);
        return { success: false, message: 'Une erreur est survenue lors de la récupération des étudiants.' };
    }
};

export const getTotalEtudiantsByNiveau = async (req, res) => {
    const {niveaux, annee}=req.query;
    try {
        // Construire la requête en utilisant $elemMatch pour correspondre exactement à l'année dans 'niveaux'
        let role = appConfigs.role.etudiant;
        

        const etudiantsParNiveau = {};
        let totalEtudiant=0;
        
        // Pour chaque niveau enseigné par l'enseignant
        // console.log(niveaux)
        if(niveaux){
            
            for (const niveau of niveaux) {
                const query = {
                    roles: { $in: [role] },
                    niveaux: {
                        $elemMatch: { niveau:niveau.niveau, annee: annee }
                    }
                };
                // Récupérer les étudiants associés à ce niveau pour l'année donnée
                const etudiants = await User.find(query);
                // Compter le nombre d'étudiants pour ce niveau
                const nombreEtudiants = etudiants.length;
                // Stocker le nombre d'étudiants dans l'objet avec la clé du niveau
                etudiantsParNiveau[niveau._id] = nombreEtudiants;
                totalEtudiant+=nombreEtudiants;
            }
        }

        
        res.json({
            success: true,
            data: {
                etudiantsParNiveau,
                totalEtudiant
            },
            
        });
        
    } catch (error) {
        console.error('Erreur lors de la récupération des étudiants :', error);
        return { success: false, message: 'Une erreur est survenue lors de la récupération des étudiants.' };
    }
};

export const getNbEtudiantsParSection = async (req, res) => {
    try {
        const { annee } = req.query;   

        // Récupérer tous les étudiants ayant des niveaux pour l'année donnée
        const etudiants = await User.find({ 'niveaux.annee': annee }).select('niveaux');
        const settings = await Setting.find().select('sections cycles niveaux');
        
        // Récupérer toutes les sections à partir des paramètres de l'objet `settings`
        const sections = settings[0].sections.map(section => section._id.toString());

        // Construire un objet pour stocker le nombre d'étudiants par section
        const etudiantsParSection = {};

        // Parcourir chaque section
        for (const sectionId of sections) {
            // Initialiser le compteur à 0 pour chaque section
            etudiantsParSection[sectionId] = 0;
        }

        // Parcourir chaque étudiant
        for (const etudiant of etudiants) {
            // Rechercher le niveau de l'étudiant courant pour l'année donnée
            const niveauEtudiant = etudiant.niveaux.find(niveau => niveau.annee == annee);
            if (niveauEtudiant) {
                // Trouver le cycle correspondant au niveau de l'étudiant
                const niveau = settings[0].niveaux.find(niveau => niveau._id.toString() === niveauEtudiant.niveau.toString());
                if (niveau) {
                    // Trouver la section correspondant au cycle
                    const cycle = settings[0].cycles.find(cycle => cycle._id.toString() === niveau.cycle.toString());
                    if (cycle) {
                        // Incrémenter le compteur de la section correspondante
                        etudiantsParSection[cycle.section.toString()]++;
                    }
                }
            }
        }
        
        res.json({
            success: true,
            data: etudiantsParSection
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des étudiants :', error);
        res.status(500).json({ success: false, message: 'Une erreur est survenue lors de la récupération des étudiants.' });
    }
};

export const getNbAbsencesParSection = async (req, res) => {
    try {
        const { annee, semestre } = req.query;

        // Récupérer tous les étudiants ayant des niveaux pour l'année donnée
        const etudiants = await User.find({ roles: { $in: [appConfigs.role.etudiant] } }).populate('absences');
        const settings = await Setting.findOne().select('sections cycles niveaux');
        
        // Récupérer toutes les sections à partir des paramètres de l'objet `settings`
        const sections = settings.sections.map(section => section._id.toString());

        // Construire un objet pour stocker le nombre d'étudiants par section
        const absencesEtudiantsParSection = {};

        // Parcourir chaque section
        for (const sectionId of sections) {
            // Initialiser le compteur à 0 pour chaque section
            absencesEtudiantsParSection[sectionId] = 0;
        }

        // Parcourir chaque étudiant
        for (const etudiant of etudiants) {
            // Filtrer les absences de l'étudiant pour le semestre et l'année donnés
            const absencesFiltrees = etudiant.absences.filter(absence => {
                return absence.semestre == semestre && absence.annee == annee;
            });


            // Calculer le total des heures d'absence pour l'étudiant
            let totalHoursOfAbsence = 0;
            for (const absence of absencesFiltrees) {
                const heureDebut = parseInt(absence.heureDebut.split(':')[0]);
                const minuteDebut = parseInt(absence.heureDebut.split(':')[1]);
                const heureFin = parseInt(absence.heureFin.split(':')[0]);
                const minuteFin = parseInt(absence.heureFin.split(':')[1]);
            
                // Calculer les heures et minutes de début et de fin en décimales
                const heureDebutDecimal = heureDebut + minuteDebut / 60;
                const heureFinDecimal = heureFin + minuteFin / 60;
            
                // Calculer la différence d'heures entre l'heure de début et l'heure de fin
                let differenceHeures = heureFinDecimal - heureDebutDecimal;
            
                // Si la différence de minutes est négative, ajuster les heures
                if (minuteFin < minuteDebut) {
                    differenceHeures -= 1 / 60; // Retirer une heure
                }
            
                totalHoursOfAbsence += differenceHeures;
            }
            

            // Trouver le niveau de l'étudiant courant pour l'année donnée
            const niveauEtudiant = etudiant.niveaux.find(niveau => niveau.annee == annee);
            if (niveauEtudiant) {
                // Trouver le cycle correspondant au niveau de l'étudiant
                const niveau = settings.niveaux.find(niveau => niveau._id.toString() === niveauEtudiant.niveau.toString());
                if (niveau) {
                    // Trouver la section correspondant au cycle
                    const cycle = settings.cycles.find(cycle => cycle._id.toString() === niveau.cycle.toString());
                    if (cycle) {
                        // Incrémenter le compteur de la section correspondante
                        let responseData;
                        if (Number.isInteger(totalHoursOfAbsence)) {
                            responseData = totalHoursOfAbsence.toString();
                        } else {
                            responseData = totalHoursOfAbsence.toFixed(2);
                        }
                        absencesEtudiantsParSection[cycle.section.toString()] += parseFloat(responseData);
                    }
                }
            }
        }
        
        res.json({
            success: true,
            data: absencesEtudiantsParSection
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des étudiants :', error);
        res.status(500).json({ success: false, message: 'Une erreur est survenue lors de la récupération des étudiants.' });
    }
};

export const generateListEtudiant = async (req, res)=>{
    const { annee } = req.params;
    const { departement, section, cycle, niveau, langue, fileType } = req.query;
    
    // Vérifier si l'ID du niveau est un ObjectId valide
    if (!mongoose.Types.ObjectId.isValid(niveau._id)) {
        return res.status(400).json({
            success: false,
            message: message.identifiant_invalide
        });
    }
    const query = {
        'niveaux': {
            $elemMatch: {
                niveau: niveau._id,
                annee: Number(annee),
            },
        },
    };

    const etudiants = await User.find(query).sort({nom:1, prenom:1});
    if(fileType.toLowerCase()==='pdf'){
        let filePath='./templates/templates_fr/template_liste_etudiant_fr.html';
        
        if(langue==='en'){
            filePath='./templates/templates_en/template_liste_etudiant_en.html'
        }
        const htmlContent = await fillTemplate( departement, section, cycle, niveau, etudiants, filePath, annee);

        // Générer le PDF à partir du contenu HTML
        generatePDFAndSendToBrowser(htmlContent, res, 'landscape');
    }else{
        exportToExcel(etudiants, langue, res, section, cycle, niveau);
    }
}

const exportToExcel = async (etudiants, langue, res,section, cycle, niveau ) => {
    if (etudiants) {
        // Créer un nouveau classeur Excel
        const workbook = new ExcelJS.Workbook();
        // Ajouter une nouvelle feuille de calcul
        const worksheet = workbook.addWorksheet('Sheet1');

        // Définir les en-têtes en fonction de la langue
        const headers = langue === 'fr' 
            ? ['Matricule', 'Nom', 'Prénom', 'Genre', 'Email', 'Date de Naissance', 
               'Lieu de Naissance', 'Section', 'Cycle', 'Niveau']
            : ['Regist.', 'Last Name', 'First Name', 'Gender', 'Email', 'Date of birth', 
               'Place of birth', 'Section', 'Cycle', 'Level'];

        // Ajouter les en-têtes à la feuille de calcul
        worksheet.addRow(headers);
        const sect = langue === 'fr'?section.libelleFr:section.libelleEn;
        // Ajouter les données des étudiants
        etudiants.forEach(etudiant => {
            worksheet.addRow([
                etudiant.matricule, etudiant.nom, etudiant.prenom, etudiant.genre, etudiant.email,
                etudiant.date_naiss ? etudiant.date_naiss.split("T")[0] : "", etudiant.lieu_naiss, 
                sect || "", cycle.code || "", niveau.code || ""
            ]);
        });

        // Définir les en-têtes de réponse pour le téléchargement du fichier
        res.setHeader('Content-Disposition', `attachment; filename=liste_etudiants_${langue}.xlsx`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        // Envoyer le fichier Excel en réponse
        await workbook.xlsx.write(res);
        res.end(); // Terminer la réponse après l'écriture du fichier
    } else {
        // Gérer le cas où `etudiants` est indéfini
        res.status(400).json({ success: false, message: message.pas_de_donnees });
    }
};

async function fillTemplate (departement, section, cycle, niveau, etudiants, filePath, annee) {
    try {
        const htmlString = await loadHTML(filePath);
        const $ = cheerio.load(htmlString); // Charger le template HTML avec cheerio
        const body = $('body');
        body.find('#division-fr').text(departement.libelleFr);
        body.find('#division-en').text(departement.libelleEn);
        body.find('#section-fr').text(section.libelleFr);
        body.find('#section-en').text(section.libelleEn);
        body.find('#cycle-niveau').text(cycle.code+""+niveau.code);
        body.find('#annee').text(formatYear(parseInt(annee)));
        const userTable = $('#table-etudiant');
        const rowTemplate = $('.row_template');
        let i = 1;
        for (const etudiant of etudiants) {
            const clonedRow = rowTemplate.clone();
            clonedRow.find('#num').text(i);
            clonedRow.find('#matricule').text(etudiant.matricule!=null?etudiant.matricule:"");
            clonedRow.find('#nom').text(etudiant.nom);
            clonedRow.find('#prenom').text(etudiant.prenom);
            clonedRow.find('#genre').text(etudiant.genre);
            clonedRow.find('#e-mail').text(etudiant.email);
            clonedRow.find('#date-naiss').text(etudiant.date_naiss!=null?formatDateFr(etudiant.date_naiss):"");
            clonedRow.find('#lieu-naiss').text(etudiant.lieu_naiss!=null?etudiant.lieu_naiss:"");
            userTable.append(clonedRow);
            i++;
        }
        rowTemplate.first().remove();

        return $.html(); // Récupérer le HTML mis à jour
    } catch (error) {
        console.error('Erreur lors du remplissage du template :', error);
        return '';
    }
};

async function lireDonneesFichierCSV(niveau, fichier) {
    
    // // Structure pour stocker les données
    const donnees = [];
    const mot_de_passe = process.env.DEFAULT_USERS_PASSWORD

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
                roles:[appConfigs.role.etudiant],
                niveaux:[{niveau:niveau, annee:2023}],
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

export const createManyEtudiant = async (req, res) => {
    try {
        const filePath = './liste_etudiant.csv';
        const niveau="665c40a406d18fba0d8236ae";
        const donnees = await lireDonneesFichierCSV(niveau,filePath);
        const result = await User.insertMany(donnees);
        res.status(201).json({ success: true, message: "Ajouté avec succès", data: result });
        

    } catch(e) {
        console.log(e);
    }
}



