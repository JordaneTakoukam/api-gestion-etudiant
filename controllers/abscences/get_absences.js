import { message } from "../../configs/message.js";
import Absence from "../../models/absences/absence.model.js";
import User from "../../models/user.model.js";
import { appConfigs } from "../../configs/app_configs.js";
import mongoose from 'mongoose';
import cheerio from 'cheerio';
import { nbTotalAbsences, formatDateFr, formatYear, generatePDFAndSendToBrowser, loadHTML, nbTotalAbsencesJustifier, nbTotalAbsencesNonJustifier } from "../../fonctions/fonctions.js";
import ExcelJS from 'exceljs'

export const getAbsencesByUserAndFilter = async (req, res) => {
    const {userId}=req.params;
    const { semestre = 1, annee = 2024 } = req.query;
    // console.log(userId+" "+semestre+" "+annee)
    try {
        // Rechercher les absences de l'utilisateur correspondant au semestre et à l'année
        const absences = await Absence.find({user:userId, annee:annee, semestre:semestre});
        
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
    let { semestre = 1, annee = 2023, page = 1, pageSize = 10 } = req.query; // Default values for semester, year, and pagination

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
                $sort: { nom: 1, prenom:1 } // Trier par nom en ordre croissant
            },
            {
                $skip: (page - 1) * pageSize // Sauter les résultats pour la pagination
            },
            {
                $limit: pageSize // Limiter les résultats par page
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
        const totalEnseignants = await User.countDocuments({ roles: { $in: [appConfigs.role.enseignant] } });
        const totalPages = Math.ceil(totalEnseignants / pageSize);
        // const totalEnseignants = enseignantsWithFilteredAbsences.length;
        // const totalPages = Math.ceil(totalEnseignants / pageSize);
        // const startIndex = (page - 1) * pageSize;
        // const endIndex = page * pageSize;
        // const enseignantsPerPage = enseignantsWithFilteredAbsences.slice(startIndex, endIndex);
        
        res.json({
            success: true,
            data: {
                enseignants: enseignantsWithFilteredAbsences,
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
    const { annee = 2023, semestre = 1, page = 1, pageSize = 10 } = req.query;

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
            .sort({nom:1, prenom:1})
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

export const searchUser = async (req, res) => {
    const {searchText} = req.params;
    let { semestre = 1, annee = 2023, limit=10 } = req.query;
    semestre = parseInt(semestre);
    annee = parseInt(annee);
    try {
        // Construire le filtre de recherche pour le nom et le prénom
        const nameFilter = {};
        if (searchText) {
            nameFilter.nom = { $regex: `^${searchText}`, $options: 'i' }; // Recherche insensible à la casse
        }

        // Recherche des enseignants avec des absences correspondant au semestre et à l'année
        let enseignantsWithFilteredAbsences = await User.aggregate([
            {
                $match: { 
                    roles: { $in: [appConfigs.role.enseignant] },
                    ...nameFilter // Ajouter le filtre de recherche par nom
                }
            },
            {
                $sort: { nom: 1, prenom:1 } // Trier par nom en ordre croissant
            },
            {
                $limit: parseInt(limit) // Limiter les résultats par page
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
       

        res.json({
            success: true,
            data: {
                enseignants: enseignantsWithFilteredAbsences,
                currentPage: 1,
                totalPages: 1,
                totalItems: enseignantsWithFilteredAbsences.length,
                pageSize: 10,
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

export const searchUserEtudiant = async (req, res) => {
    const { searchText } = req.params;
    let { semestre = 1, annee = 2023, limit = 10 } = req.query;
    semestre = parseInt(semestre);
    annee = parseInt(annee);
    limit = parseInt(limit);

    try {
        // Construire le filtre de recherche pour le nom et le prénom
        const nameFilter = {};
        if (searchText) {
            nameFilter.nom = { $regex: `^${searchText}`, $options: 'i' }; // Recherche insensible à la casse
        }

        // Recherche des etudiants avec des absences correspondant au semestre et à l'année
        let etudiantsWithFilteredAbsences = await User.aggregate([
            {
                $match: {
                    roles: { $in: [appConfigs.role.etudiant] },
                    ...nameFilter, // Ajouter le filtre de recherche par nom
                    'niveaux.annee': annee // Filtrer par niveaux.annee
                }
            },
            {
                $sort: { nom: 1, prenom: 1 } // Trier par nom en ordre croissant
            },
            {
                $limit: limit // Limiter les résultats par page
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

        // Trier les étudiants par le nombre d'absences dans l'ordre décroissant
        etudiantsWithFilteredAbsences.forEach(etudiant => {
            // Trier les absences par date d'absence dans l'ordre croissant
            etudiant.absences.sort((a, b) => new Date(a.dateAbsence) - new Date(b.dateAbsence));
        });

        res.json({
            success: true,
            data: {
                etudiants: etudiantsWithFilteredAbsences,
                currentPage: 1,
                totalPages: 1,
                totalItems: etudiantsWithFilteredAbsences.length,
                pageSize: limit,
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
    let { semestre = 1, annee = 2023 } = req.query; // Default values for semester, year, and pagination

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
                $sort: { nom: 1, prenom:1 } // Trier par nom en ordre croissant
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

export const generateListAbsenceEnseignant = async (req, res)=>{
    let { semestre = 1, annee = 2023, langue, fileType } = req.query; // Default values for semester, year, and pagination
    
    // Convert semestre and annee to numbers
    semestre = parseInt(semestre);
    annee = parseInt(annee);

    let enseignantsWithFilteredAbsences = await User.aggregate([
        {
            $match: { roles: { $in: [appConfigs.role.enseignant] } }
        },
        {
            $sort: { nom: 1, prenom:1 } // Trier par nom en ordre croissant
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
    if(fileType.toLowerCase() === 'pdf'){
        // Sort the enseignantsWithFilteredAbsences array in descending order by the length of absences array
        enseignantsWithFilteredAbsences.forEach(enseignant => {
            // Sorting the absences array by the dateAbsence field in ascending order
            enseignant.absences.sort((a, b) => new Date(a.dateAbsence) - new Date(b.dateAbsence));
        });
        let filePath='./templates/templates_fr/template_liste_absences_enseignant_fr.html';
        if(langue==='en'){
            filePath='./templates/templates_en/template_liste_absences_enseignant_en.html'
        }
        const htmlContent = await fillTemplateE(langue, enseignantsWithFilteredAbsences, filePath, annee, semestre);

        // Générer le PDF à partir du contenu HTML
        generatePDFAndSendToBrowser(htmlContent, res, 'landscape');
    }else{
        const users = enseignantsWithFilteredAbsences;
        exportToExcel(users, langue, res);
    }
}

async function fillTemplateE (langue, enseignants, filePath, annee, semestre) {
    try {
        const htmlString = await loadHTML(filePath);
        const $ = cheerio.load(htmlString); // Charger le template HTML avec cheerio
        const body = $('body');
        body.find('#annee').text(formatYear(parseInt(annee)));
        body.find('#semestre').text(semestre);
        const userTable = $('#table-enseignant');
        const rowTemplate = $('.row_template');
        let i = 1;
        for (const enseignant of enseignants) {
            const clonedRow = rowTemplate.clone();
            clonedRow.find('#num').text(i);
            clonedRow.find('#matricule').text(enseignant.matricule!=null?enseignant.matricule:"");
            clonedRow.find('#nom').text(enseignant.nom);
            clonedRow.find('#prenom').text(enseignant.prenom);
            clonedRow.find('#genre').text(enseignant.genre);
            clonedRow.find('#e-mail').text(enseignant.email);
            clonedRow.find('#date-naiss').text(enseignant.date_naiss!=null?formatDateFr(enseignant.date_naiss):"");
            clonedRow.find('#lieu-naiss').text(enseignant.lieu_naiss!=null?enseignant.lieu_naiss:"");
            clonedRow.find('#absences').text(nbTotalAbsences(enseignant.absences));
            clonedRow.find('#justifier').text(nbTotalAbsencesJustifier(enseignant.absences));
            clonedRow.find('#non_justifier').text(nbTotalAbsencesNonJustifier(enseignant.absences));
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

export const getAllAbsencesWithEtudiantsByFilter = async (req, res) => {
    const { niveauId } = req.params;
    const { annee = 2023, semestre = 1 } = req.query;

    try {
        // Vérifier si l'ID du niveau est un ObjectId valide
        if (!mongoose.Types.ObjectId.isValid(niveauId)) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide,
            });
        }
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

        const etudiants = await User.find(query).populate('absences').sort({nom:1, prenom:1});

        // Filtrer les niveaux qui ne correspondent pas au niveau et à l'année de recherche
        etudiants.forEach((etudiant) => {
            etudiant.niveaux = etudiant.niveaux.filter((niveau) => niveau.niveau.toString() === niveauId && niveau.annee === Number(annee));
            etudiant.absences = etudiant.absences.filter((absence) => absence.semestre === Number(semestre) && absence.annee === Number(annee));
        });
        


        res.json({
            success: true,
            data: {
                etudiants,
                currentPage: 0,
                totalPages: 0,
                totalItems: 0,
                pageSize:0,
            },
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des étudiants :', error);
        res.status(500).json({ success: false, message: 'Une erreur est survenue sur le serveur.' });
    }
};

export const generateListAbsenceEtudiant = async (req, res)=>{
    const { annee, semestre } = req.params;
    const { departement, section, cycle, niveau, langue, fileType } = req.query;

    // Vérifier si l'ID du niveau est un ObjectId valide
    if (!mongoose.Types.ObjectId.isValid(niveau._id)) {
        return res.status(400).json({
            success: false,
            message: message.identifiant_invalide,
        });
    }
    // Construire la requête en utilisant $elemMatch pour correspondre exactement au niveau et à l'année dans 'niveaux',
    // et en ajoutant un filtre pour le semestre et l'année dans 'absences'
    const query = {
        'niveaux': {
            $elemMatch: {
                niveau: niveau._id,
                annee: Number(annee),
            },
        },

    };

    const etudiants = await User.find(query).populate('absences').sort({nom:1, prenom:1});

    if(fileType.toLowerCase() === 'pdf'){
        // Filtrer les niveaux qui ne correspondent pas au niveau et à l'année de recherche
        etudiants.forEach((etudiant) => {
            etudiant.niveaux = etudiant.niveaux.filter((niveau) => niveau.niveau.toString() === niveau._id && niveau.annee === Number(annee));
            etudiant.absences = etudiant.absences.filter((absence) => absence.semestre === Number(semestre) && absence.annee === Number(annee));
        });
        let filePath='./templates/templates_fr/template_liste_absences_etudiant_fr.html';
        if(langue==='en'){
            filePath='./templates/templates_en/template_liste_absences_etudiant_en.html'
        }
        const htmlContent = await fillTemplate(departement, section, cycle, niveau, langue, etudiants, filePath, annee, semestre);

        // Générer le PDF à partir du contenu HTML
        generatePDFAndSendToBrowser(htmlContent, res, 'landscape');
    }else{
        const users = etudiants
        exportToExcel(users, langue, res, section, cycle, niveau);
    }
}

const exportToExcel = async (users, langue, res,section, cycle, niveau ) => {
    if (users) {
        // Créer un nouveau classeur Excel
        const workbook = new ExcelJS.Workbook();
        // Ajouter une nouvelle feuille de calcul
        const worksheet = workbook.addWorksheet('Sheet1');

        // Définir les en-têtes en fonction de la langue
        var headers=[];
        if(section && cycle && niveau){
            headers = langue === 'fr' 
                ? ['Matricule', 'Nom', 'Prénom', 'Genre', 'Section', 'Cycle', 'Niveau', 'Absences(H)', 'Justifiées(H)', 'Non Justifiées(H)']
                : ['Regist.', 'Last Name', 'First Name', 'Gender', 'Section', 'Cycle', 'Level', 'Absences(H)', 'Justified(H)', 'Not Justified(H)'];
        }else{
            headers = langue === 'fr' 
            ? ['Matricule', 'Nom', 'Prénom', 'Genre', 'Absences(H)', 'Justifiées(H)', 'Non Justifiées(H)']
            : ['Regist.', 'Last Name', 'First Name', 'Gender', 'Absences(H)', 'Justified(H)', 'Not Justified(H)'];
        }

        // Ajouter les en-têtes à la feuille de calcul
        worksheet.addRow(headers);
        
        // Ajouter les données des étudiants
        users.forEach(user => {
            if(section && cycle && niveau){
                const sect = langue === 'fr'?section.libelleFr:section.libelleEn;
                worksheet.addRow([
                    user.matricule, user.nom, user.prenom, user.genre, sect || "", cycle.code || "", niveau.code || "",
                    nbTotalAbsences(user.absences), nbTotalAbsencesJustifier(user.absences), nbTotalAbsencesNonJustifier(user.absences)
                ]);
            }else{
                worksheet.addRow([
                    user.matricule, user.nom, user.prenom, user.genre,
                    nbTotalAbsences(user.absences), nbTotalAbsencesJustifier(user.absences), nbTotalAbsencesNonJustifier(user.absences)

                ]);
            }
        });

        // Définir les en-têtes de réponse pour le téléchargement du fichier
        res.setHeader('Content-Disposition', `attachment; filename=absences_${langue}.xlsx`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        // Envoyer le fichier Excel en réponse
        await workbook.xlsx.write(res);
        res.end(); // Terminer la réponse après l'écriture du fichier
    } else {
        // Gérer le cas où `etudiants` est indéfini
        res.status(400).json({ success: false, message: message.pas_de_donnees });
    }
};

async function fillTemplate (departement, section, cycle, niveau, langue, etudiants, filePath, annee, semestre) {
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
        body.find('#semestre').text(semestre);
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
            clonedRow.find('#absences').text(nbTotalAbsences(etudiant.absences));
            clonedRow.find('#justifier').text(nbTotalAbsencesJustifier(etudiant.absences));
            clonedRow.find('#non_justifier').text(nbTotalAbsencesNonJustifier(etudiant.absences));
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





  

  


