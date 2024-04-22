import User from '../../../models/user.model.js';
import { message } from '../../../configs/message.js';
import { appConfigs } from "../../../configs/app_configs.js";
import mongoose from 'mongoose';
import { sendPasswordOnEmail } from "../../../utils/send_password_on_email.js";
import bcrypt from "bcrypt";
import { DateTime } from "luxon";
import Absences from '../../../models/absence.model.js';
import Setting from '../../../models/setting.model.js';

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
        if (matricule) {
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
            absences : [],
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

        grade,
        categorie,
        fonction,
        service,
        commune,

    } = req.body;
    console.log(roles);
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
        existingEtudiant.roles = roles;

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
        const etudiants =await User.aggregate([
            {
                $match: { roles: { $in: [appConfigs.role.etudiant] }, 'niveaux.annee': annee }
            },
            {
                $lookup: {
                    from: "absences",
                    localField: "absences",
                    foreignField: "_id",
                    as: "absences"
                }
            },
            {
                $addFields: {
                    totalHoursOfAbsence: {
                        $sum: {
                            $map: {
                                input: {
                                    $filter: {
                                        input: "$absences",
                                        as: "absence",
                                        cond: {
                                            $and: [
                                                { $eq: ["$$absence.semestre", semestre] },
                                                { $eq: ["$$absence.annee", annee] }
                                            ]
                                        }
                                    }
                                },
                                as: "absence",
                                in: {
                                    $subtract: [
                                        {
                                            $add: [
                                                { $toInt: { $substrCP: ["$$absence.heureFin", 0, 2] } }, // Convertir les heures de fin en décimal
                                                { $divide: [{ $toInt: { $substrCP: ["$$absence.heureFin", 3, 2] } }, 60] } // Convertir les minutes de fin en décimal
                                            ]
                                        },
                                        {
                                            $add: [
                                                { $toInt: { $substrCP: ["$$absence.heureDebut", 0, 2] } }, // Convertir les heures de début en décimal
                                                { $divide: [{ $toInt: { $substrCP: ["$$absence.heureDebut", 3, 2] } }, 60] } // Convertir les minutes de début en décimal
                                            ]
                                        }
                                    ]
                                } // Calculer la durée de chaque absence
                            }
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 1,
                    nom: 1,
                    prenom: 1,
                    niveaux:1,
                    totalHoursOfAbsence: 1
                }
            }
        ]);

        const settings = await Setting.find().select('sections cycles niveaux');
        
        // Récupérer toutes les sections à partir des paramètres de l'objet `settings`
        const sections = settings[0].sections.map(section => section._id.toString());

        // Construire un objet pour stocker le nombre d'étudiants par section
        const absencesEtudiantsParSection = {};

        // Parcourir chaque section
        for (const sectionId of sections) {
            // Initialiser le compteur à 0 pour chaque section
            absencesEtudiantsParSection[sectionId] = 0;
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
                        let responseData;
                        if (Number.isInteger(totalHoursOfAbsence)) {
                            responseData = etudiant.totalHoursOfAbsence;
                        } else {
                            responseData = etudiant.totalHoursOfAbsence.toFixed(2);
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


