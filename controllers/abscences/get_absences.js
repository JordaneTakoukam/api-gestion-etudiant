import { message } from "../../configs/message.js";
import Absence from "../../models/absence.model.js";
import User from "../../models/user.model.js";
import { appConfigs } from "../../configs/app_configs.js";
import mongoose from 'mongoose';

export const getAbsencesByUserAndFilter = async (req, res) => {
    const {userId}=req.params;
    const { semestre = 1, annee = 2024 } = req.query;
    console.log(userId+" "+semestre+" "+annee)
    try {
        // Rechercher les absences de l'utilisateur correspondant au semestre et à l'année
        const absences = await Absence.find({user:userId, annee:annee, semestre:semestre});
        console.log(absences)
        res.json({
            success: true,
            data: {
                absences: absences
            }
        });
    } catch (error) {
        console.error("Erreur interne au serveur :", error);
        res.status(500).json({
            success: false,
            message: "Erreur interne au serveur."
        });
    }
};


export const getAbsencesWithEnseignantsByFilter = async (req, res) => {
    let { semestre = 1, annee = 2024, page = 1, pageSize = 10 } = req.query; // Default values for semester, year, and pagination

    // Convert semestre and annee to numbers
    semestre = parseInt(semestre);
    annee = parseInt(annee);
    page = parseInt(page);
    pageSize = parseInt(pageSize);

    try {
        // Search for teachers with absences corresponding to the semester and year
        let enseignantsWithFilteredAbsences = await User.aggregate([
            {
                $match: { roles: { $in: [appConfigs.role.enseignant] } }
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
                    absences: {
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
                    }
                }
            },
            {
                $project: {
                    verificationCode: 0,
                    roles: 0,
                    date_creation: 0,
                    mot_de_passe: 0,
                    grade: 0,
                    categorie: 0,
                    fonction: 0,
                    service: 0,
                    commune: 0,
                    __v: 0,
                    niveaux: 0,
                    historique_connexion: 0
                }
            }
        ]);

        // Sort the enseignantsWithFilteredAbsences array in descending order by the length of absences array
        enseignantsWithFilteredAbsences.forEach(enseignant => {
            // Sorting the absences array by the dateAbsence field in ascending order
            enseignant.absences.sort((a, b) => new Date(a.dateAbsence) - new Date(b.dateAbsence));
        });
        // Pagination
        const totalEnseignants = enseignantsWithFilteredAbsences.length;
        const totalPages = Math.ceil(totalEnseignants / pageSize);
        const startIndex = (page - 1) * pageSize;
        const endIndex = page * pageSize;
        const enseignantsPerPage = enseignantsWithFilteredAbsences.slice(startIndex, endIndex);
        
        res.json({
            success: true,
            data: {
                enseignants: enseignantsPerPage,
                currentPage: page,
                totalPages: totalPages,
                totalItems: totalEnseignants,
                pageSize: pageSize
            }
        });
    } catch (error) {
        console.error("Internal Server Error:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

export const getAbsencesWithEtudiantsByFilter = async (req, res) => {
    const { niveauId } = req.params;
    const { annee = 2024, semestre = 1, page = 1, pageSize = 10 } = req.query;

    try {
        // Vérifier si l'ID du niveau est un ObjectId valide
        if (!mongoose.Types.ObjectId.isValid(niveauId)) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide,
            });
        }

        const skip = (page - 1) * pageSize;

        // Construire la requête en utilisant $elemMatch pour correspondre exactement au niveau et à l'année dans 'niveaux',
        // et en ajoutant un filtre pour le semestre et l'année dans 'absences'
        const query = {
            'niveaux': {
                $elemMatch: {
                    niveau: niveauId,
                    annee: Number(annee),
                },
            },

        };

        const etudiants = await User.find(query).populate('absences')
            .skip(skip)
            .limit(Number(pageSize));

        // Filtrer les niveaux qui ne correspondent pas au niveau et à l'année de recherche
        etudiants.forEach((etudiant) => {
            etudiant.niveaux = etudiant.niveaux.filter((niveau) => niveau.niveau.toString() === niveauId && niveau.annee === Number(annee));
            etudiant.absences = etudiant.absences.filter((absence) => absence.semestre === Number(semestre) && absence.annee === Number(annee));
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


// export const getAbsencesWithEtudiantsByFilter = async (req, res) => {
//     const { niveauId } = req.params;
//     const { semestre = 1, annee = 2024, page = 1, pageSize = 10 } = req.query; // Valeurs par défaut pour le semestre, l'année et la pagination
    
//     try {
//         // Rechercher les étudiants avec absences correspondant au semestre, à l'année et au niveau
//         const etudiantsWithFilteredAbsences = await User.aggregate([
//             {
//                 $match: { 
//                     roles: { $in: [appConfigs.role.etudiant] },
//                     "niveaux.niveau": niveauId
//                 } // Filtrer par le niveau
//             },
//             {
//                 $lookup: {
//                     from: "absences",
//                     localField: "absences",
//                     foreignField: "_id",
//                     as: "absences"
//                 }
//             },
//             {
//                 $addFields: {
//                     absences: {
//                         $filter: {
//                             input: "$absences",
//                             as: "absence",
//                             cond: {
//                                 $and: [
//                                     { $eq: ["$$absence.semestre", semestre] },
//                                     { $eq: ["$$absence.annee", annee] }
//                                 ]
//                             }
//                         }
//                     }
//                 }
//             },
//             {
//                 $project: {
//                     verificationCode: 0,
//                     roles: 0,
//                     date_creation: 0,
//                     mot_de_passe: 0,
//                     grade: 0,
//                     categorie: 0,
//                     fonction: 0,
//                     service: 0,
//                     commune: 0,
//                     __v: 0,
//                     niveaux: 0,
//                     historique_connexion: 0
//                 }
//             }
//         ]);

//         // Pagination
//         const totalEtudiants = etudiantsWithFilteredAbsences.length;
//         const totalPages = Math.ceil(totalEtudiants / parseInt(pageSize));
//         const startIndex = (parseInt(page) - 1) * parseInt(pageSize);
//         const endIndex = parseInt(page) * parseInt(pageSize);
//         const etudiantsPerPage = etudiantsWithFilteredAbsences.slice(startIndex, endIndex);

//         res.json({
//             success: true,
//             data: {
//                 etudiants: etudiantsPerPage,
//                 currentPage: parseInt(page),
//                 totalPages: totalPages,
//                 totalItems: totalEtudiants,
//                 pageSize: parseInt(pageSize)
//             }
//         });
//     } catch (error) {
//         console.error("Erreur interne au serveur :", error);
//         res.status(500).json({
//             success: false,
//             message: message.erreurServeur,
//         });
//     }
// };



export const getAllAbsencesWithEnseignantsByFilter = async (req, res) => {
    let { semestre = 1, annee = 2024 } = req.query; // Default values for semester, year, and pagination

    // Convert semestre and annee to numbers
    semestre = parseInt(semestre);
    annee = parseInt(annee);

    try {
        // Search for teachers with absences corresponding to the semester and year
        let enseignantsWithFilteredAbsences = await User.aggregate([
            {
                $match: { roles: { $in: [appConfigs.role.enseignant] } }
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
                    absences: {
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
                    }
                }
            },
            {
                $project: {
                    verificationCode: 0,
                    roles: 0,
                    date_creation: 0,
                    mot_de_passe: 0,
                    grade: 0,
                    categorie: 0,
                    fonction: 0,
                    service: 0,
                    commune: 0,
                    __v: 0,
                    niveaux: 0,
                    historique_connexion: 0
                }
            }
        ]);

        // Sort the enseignantsWithFilteredAbsences array in descending order by the length of absences array
        enseignantsWithFilteredAbsences.forEach(enseignant => {
            // Sorting the absences array by the dateAbsence field in ascending order
            enseignant.absences.sort((a, b) => new Date(a.dateAbsence) - new Date(b.dateAbsence));
        });
        // Pagination
        // const totalEnseignants = enseignantsWithFilteredAbsences.length;
        // const totalPages = Math.ceil(totalEnseignants / pageSize);
        // const startIndex = (page - 1) * pageSize;
        // const endIndex = page * pageSize;
        // const enseignantsPerPage = enseignantsWithFilteredAbsences.slice(startIndex, endIndex);
        
        res.json({
            success: true,
            data: {
                enseignants: enseignantsWithFilteredAbsences,
                currentPage: 0,
                totalPages: 0,
                totalItems: 0,
                pageSize: 0
            }
        });
    } catch (error) {
        console.error("Internal Server Error:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

export const getAllAbsencesWithEtudiantsByFilter = async (req, res) => {
    const { semestre = 1, annee = 2024 } = req.query; // Valeurs par défaut pour le semestre, l'année et la pagination

    try {
        // Rechercher les étudiants avec absences correspondant au semestre et à l'année
        const etudiantsWithFilteredAbsences = await User.aggregate([
            {
                $match: { roles: { $in: [appConfigs.role.etudiant] } }
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
                    absences: {
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
                    }
                }
            },
            {
                $project: {
                    verificationCode: 0,
                    roles: 0,
                    date_creation: 0,
                    mot_de_passe: 0,
                    grade: 0,
                    categorie: 0,
                    fonction: 0,
                    service: 0,
                    commune: 0,
                    __v: 0,
                    niveaux: 0,
                    historique_connexion: 0
                }
            }
        ]);

        // Pagination
        // const totalEtudiants = etudiantsWithFilteredAbsences.length;
        // const totalPages = Math.ceil(totalEtudiants / parseInt(pageSize));
        // const startIndex = (parseInt(page) - 1) * parseInt(pageSize);
        // const endIndex = parseInt(page) * parseInt(pageSize);
        // const etudiantsPerPage = etudiantsWithFilteredAbsences.slice(startIndex, endIndex);

        res.json({
            success: true,
            data: {
                etudiants: etudiantsWithFilteredAbsences,
                currentPage: 0,
                totalPages: 0,
                totalItems: 0,
                pageSize: 0
            }
        });
    } catch (error) {
        console.error("Erreur interne au serveur :", error);
        res.status(500).json({
            success: false,
            message: message.erreurServeur,
        });
    }
};

export const getTotalHoursOfAbsenceByTeacher = async (req, res) => {
    let { semestre = 1, annee = 2024 } = req.query; // Valeurs par défaut pour le semestre et l'année

    // Convertir le semestre et l'année en nombres entiers
    semestre = parseInt(semestre);
    annee = parseInt(annee);

    try {
        // Recherche des enseignants avec des absences correspondant au semestre et à l'année
        const enseignantsWithFilteredAbsences = await User.aggregate([
            {
                $match: { roles: { $in: [appConfigs.role.enseignant] } }
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
                    totalHoursOfAbsence: 1
                }
            }
        ]);

        // Calculer le total des heures d'absence pour tous les enseignants
        let totalHoursOfAbsence = 0;
        enseignantsWithFilteredAbsences.forEach(enseignant => {
            totalHoursOfAbsence += enseignant.totalHoursOfAbsence;
        });

        let responseData;
        if (Number.isInteger(totalHoursOfAbsence)) {
            responseData = totalHoursOfAbsence.toString();
        } else {
            responseData = totalHoursOfAbsence.toFixed(2);
        }

        res.json({
            success: true,
            data: responseData // Résultat en heures sans conversion
        });
    } catch (error) {
        console.error("Internal Server Error:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

export const getTotalHoursOfAbsenceByStudent = async (req, res) => {
    let { semestre = 1, annee = 2024 } = req.query; // Valeurs par défaut pour le semestre et l'année

    // Convertir le semestre et l'année en nombres entiers
    semestre = parseInt(semestre);
    annee = parseInt(annee);

    try {
        // Recherche des enseignants avec des absences correspondant au semestre et à l'année
        const etudiantsWithFilteredAbsences = await User.aggregate([
            {
                $match: { roles: { $in: [appConfigs.role.etudiant] } }
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
                    totalHoursOfAbsence: 1
                }
            }
        ]);

        // Calculer le total des heures d'absence pour tous les enseignants
        let totalHoursOfAbsence = 0;
        etudiantsWithFilteredAbsences.forEach(enseignant => {
            totalHoursOfAbsence += enseignant.totalHoursOfAbsence;
        });

        let responseData;
        if (Number.isInteger(totalHoursOfAbsence)) {
            responseData = totalHoursOfAbsence.toString();
        } else {
            responseData = totalHoursOfAbsence.toFixed(2);
        }

        res.json({
            success: true,
            data: responseData // Résultat en heures sans conversion
        });
    } catch (error) {
        console.error("Internal Server Error:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};





  

  


