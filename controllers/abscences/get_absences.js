import { message } from "../../configs/message.js";
import Absence from "../../models/absence.model.js";
import User from "../../models/user.model.js";
import { appConfigs } from "../../configs/app_configs.js";

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
    const { semestre = 1, annee = 2024, page = 1, pageSize = 10 } = req.query; // Valeurs par défaut pour le semestre, l'année et la pagination

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
        const totalEtudiants = etudiantsWithFilteredAbsences.length;
        const totalPages = Math.ceil(totalEtudiants / parseInt(pageSize));
        const startIndex = (parseInt(page) - 1) * parseInt(pageSize);
        const endIndex = parseInt(page) * parseInt(pageSize);
        const etudiantsPerPage = etudiantsWithFilteredAbsences.slice(startIndex, endIndex);

        res.json({
            success: true,
            data: {
                etudiants: etudiantsPerPage,
                currentPage: parseInt(page),
                totalPages: totalPages,
                totalItems: totalEtudiants,
                pageSize: parseInt(pageSize)
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
