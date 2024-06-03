import Matiere from '../../models/matiere.model.js'
import Periode from '../../models/periode.model.js'
import Chapitre from '../../models/chapitre.model.js'
import { message } from '../../configs/message.js';
import mongoose from 'mongoose';
import Setting from '../../models/setting.model.js';
import { calculateProgress, formatYear, generatePDFAndSendToBrowser, loadHTML } from '../../fonctions/fonctions.js';
import cheerio from 'cheerio';
import { extractRawText } from 'mammoth';

// create
export const createMatiere = async (req, res) => { 
    const {code, libelleFr, libelleEn, prerequisFr, prerequisEn, approchePedFr, approchePedEn, evaluationAcquisFr, evaluationAcquisEn, typesEnseignement, chapitres, objectifs } = req.body;

    try {

        // Vérifier que tous les champs obligatoires sont présents
        // if (!code || !libelleFr || !libelleEn || !niveau || !typesEnseignement) {
        if (!libelleFr || !libelleEn || !typesEnseignement) {
            return res.status(400).json({ success: false, message: message.champ_obligatoire });
        }


        for (const typeEnseignement of typesEnseignement) {
            if (!mongoose.Types.ObjectId.isValid(typeEnseignement.typeEnseignement)) {
                return res.status(400).json({ 
                    success: false, 
                    message: message.identifiant_invalide,
                });
            }
            if (!mongoose.Types.ObjectId.isValid(typeEnseignement.enseignantPrincipal)) {
                return res.status(400).json({ 
                    success: false, 
                    message: message.identifiant_invalide,
                });
            }
            
            if (typeEnseignement.enseignantSuppleant && !mongoose.Types.ObjectId.isValid(typeEnseignement.enseignantSuppleant)) {
                return res.status(400).json({ 
                    success: false, 
                    message: message.identifiant_invalide,
                });
            }
        }

        if (chapitres) {
            for (const chapitre of chapitres) {
                if (!mongoose.Types.ObjectId.isValid(chapitre)) {
                    return res.status(400).json({ 
                        success: false, 
                        message: message.identifiant_invalide,
                    });
                }
            }
        }

        if (objectifs) {
            for (const objectif of objectifs) {
                if (!mongoose.Types.ObjectId.isValid(objectif)) {
                    return res.status(400).json({ 
                        success: false, 
                        message: message.identifiant_invalide,
                    });
                }
            }
        }

        // Vérifier si le code de existe déjà
        if(code){
            const existingCode = await Matiere.findOne({ code: code });
            if (existingCode) {
                return res.status(400).json({
                    success: false,
                    message: message.existe_code
                });
            }
        }
        

        // Vérifier si le libelle fr de  existe déjà
        const existingLibelleFr = await Matiere.findOne({libelleFr: libelleFr});
        if (existingLibelleFr) {
            return res.status(400).json({
                success: false,
                message: message.existe_libelle_fr,
            });
        }
        // Vérifier si le libelle en existe déjà
        const existingLibelleEn = await Matiere.findOne({libelleEn: libelleEn});

        if (existingLibelleEn) {
            return res.status(400).json({
                success: false,
                message: message.existe_libelle_en,
            });
        }
        // Créer une nouvelle matière avec les données reçues
        const nouvelleMatiere = new Matiere({
            code,
            libelleFr,
            libelleEn,
            prerequisFr,
            prerequisEn,
            approchePedFr,
            approchePedEn,
            evaluationAcquisFr,
            evaluationAcquisEn,
            typesEnseignement,
            chapitres,
            objectifs
        });

        // Enregistrer la nouvelle matière dans la base de données
        const saveMatiere = await nouvelleMatiere.save();

        res.status(200).json({ 
            success: true, 
            message: message.ajouter_avec_success,
            data:saveMatiere });
    } catch (error) {
        console.error('Erreur lors de l\'enregistrement de la matière :', error);
        res.status(500).json({ success: false, message: message.erreurServeur });
    }
}

// update
export const updateMatiere = async (req, res) => {
    const { matiereId } = req.params; // Récupérer l'ID de la matière depuis les paramètres de la requête
    const { code, libelleFr, libelleEn, prerequisFr, prerequisEn, approchePedFr, approchePedEn, evaluationAcquisFr, evaluationAcquisEn, typesEnseignement, chapitres, objectifs } = req.body;

    try {
        // Vérifier que tous les champs obligatoires sont présents
        // if (!code || !libelleFr || !libelleEn || !niveau || !typesEnseignement) {
        if (!libelleFr || !libelleEn || !typesEnseignement) {
            return res.status(400).json({ success: false, message: message.champ_obligatoire });
        }
        // Vérifier si l'ID de la matière est un ObjectId valide
        if (!mongoose.Types.ObjectId.isValid(matiereId)) {
            return res.status(400).json({ 
                success: false, 
                message: message.identifiant_invalide
            });
        }

        // Vérifier si la matière à modifier existe dans la base de données
        const existingMatiere = await Matiere.findById(matiereId);
        if (!existingMatiere) {
            return res.status(404).json({ 
                success: false, 
                message: message.matiere_non_trouvee
            });
        }

        // Vérifier si le code existe déjà (sauf pour l'événement actuel)
        if (code!=="" && existingMatiere.code !== code) {
            const existingCode = await Matiere.findOne({ code: code });
            if (existingCode) {
                return res.status(400).json({
                    success: false,
                    message: message.existe_code
                });
            }
        }

        //vérifier si le libelle fr existe déjà
        if (existingMatiere.libelleFr !== libelleFr) {
            const existingCode = await Matiere.findOne({ libelleFr: libelleFr });
            if (existingCode) {
                return res.status(400).json({
                    success: false,
                    message: message.existe_libelle_fr
                });
            }
        }

        //vérifier si le libelle en  existe déjà
        if (existingMatiere.libelleEn !== libelleEn) {
            const existingCode = await Matiere.findOne({ libelleEn: libelleEn });
            if (existingCode) {
                return res.status(400).json({
                    success: false,
                    message: message.existe_libelle_en
                });
            }
        }


        // Mettre à jour les champs de la matière avec les nouvelles valeurs
        existingMatiere.code = code;
        existingMatiere.libelleFr = libelleFr;
        existingMatiere.libelleEn = libelleEn;
        existingMatiere.prerequisFr = prerequisFr;
        existingMatiere.prerequisEn = prerequisEn;
        existingMatiere.approchePedFr = approchePedFr;
        existingMatiere.approchePedEn = approchePedEn;
        existingMatiere.evaluationAcquisFr = evaluationAcquisFr;
        existingMatiere.evaluationAcquisEn = evaluationAcquisEn;
        existingMatiere.typesEnseignement = typesEnseignement;
        existingMatiere.chapitres = chapitres;
        existingMatiere.objectifs = objectifs;

        // Enregistrer les modifications dans la base de données
        const updatedMatiere = await existingMatiere.save();
        // const updatedEnseignements = await Matiere.findById(updatedMatiere._id)
        //                             .populate('typesEnseignement.enseignantPrincipal', '_id nom prenom')
        //                             .populate('typesEnseignement.enseignantSuppleant', '_id nom prenom');

        res.status(200).json({ 
            success: true, 
            message: message.mis_a_jour,
            data: updatedMatiere
        });
    } catch (error) {
        console.error('Erreur lors de la mise à jour de la matière :', error);
        res.status(500).json({ 
            success: false, 
            message: message.erreurServeur 
        });
    }
}

// delete
export const deleteMatiere = async (req, res) => {
    const { matiereId } = req.params;

    try {
        // Vérifier si l'ID de la matiere est un ObjectId valide
        if (!mongoose.Types.ObjectId.isValid(matiereId)) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide
            });
        }

        // Supprimer tous les chapitres liés à la matière
        await Chapitre.deleteMany({ matiere: matiereId });
        
        // Supprimer la matiere par son ID
        const deletedMatiere = await Matiere.findByIdAndDelete(matiereId);
        if (!deletedMatiere) {
            return res.status(404).json({
                success: false,
                message: message.matiere_non_trouvee
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

export const getMatieresByNiveau = async (req, res) => {
    const {niveauId} = req.params; // Supposons que le niveauId soit passé en tant que paramètre d'URL
    const {annee, semestre}=req.query;

    try {

        if(niveauId && annee && semestre){
            const filter = { 
                niveau: niveauId
            };

            // Si une année est spécifiée dans la requête, l'utiliser
            if (annee && !isNaN(annee)) {
                filter.annee = parseInt(annee);
            }

            // Si un semestre est spécifié dans la requête, l'utiliser
            if (semestre && !isNaN(semestre)) {
                filter.semestre = parseInt(semestre);
            }

            // Rechercher les périodes en fonction du filtre
            const periodes = await Periode.find(filter).select('matiere').exec();

            // Extraire les identifiants uniques des matières
            const matiereIds = [...new Set(periodes.map(periode => periode.matiere))];

            // Récupérer les détails de chaque matière à partir des identifiants uniques
            const matieres = await Matiere.find({ _id: { $in: matiereIds } }).populate('chapitres').populate('objectifs');
            res.status(200).json({ 
                success: true, 
                data: {
                    matieres ,
                    totalPages: 0,
                    currentPage: 0,
                    totalItems: 0,
                    pageSize:0
                }
            });
        }else{
            
            // Récupérer la liste des matières avec tous leurs détails
            const matieres = await Matiere.find({}).populate('chapitres').populate('objectifs');
            res.status(200).json({ 
                success: true, 
                data: {
                    matieres ,
                    totalPages: 0,
                    currentPage: 0,
                    totalItems: 0,
                    pageSize:0
                }
            });
        }
    } catch (error) {
        console.error('Erreur lors de la récupération des matières par niveau :', error);
        res.status(500).json({ success: false, message: message.erreurServeur });
    }
};

export const generateListMatByNiveau = async (req, res)=>{
    const {annee, semestre} = req.params; 
    const { langue, departement, section, cycle, niveau}=req.query;
    let matieres=[];
    if(annee && semestre && niveau){
        const filter = { 
            niveau: niveau._id
        };

        // Si une année est spécifiée dans la requête, l'utiliser
        if (annee && !isNaN(annee)) {
            filter.annee = parseInt(annee);
            // let periodesCurrentYear = await Periode.findOne(filter).exec();
            // if (!periodesCurrentYear) {
            //     // Si aucune période pour l'année actuelle, rechercher dans les années précédentes jusqu'à en trouver une
            //     let found = false;
            //     let previousYear = parseInt(annee) - 1;
            //     while (!found && previousYear >= 2023) { // Limite arbitraire de 2023 pour éviter une boucle infinie
            //         periodesCurrentYear = await Periode.findOne({ annee: previousYear, ...filter }).exec();
            //         if (periodesCurrentYear) {
            //             filter.annee = previousYear;
            //             found = true;
            //         } else {
            //             previousYear--;
            //         }
            //     }
            // } 
        }

        // Si un semestre est spécifié dans la requête, l'utiliser
        if (semestre && !isNaN(semestre)) {
            filter.semestre = parseInt(semestre);
        }

        // Rechercher les périodes en fonction du filtre
        const periodes = await Periode.find(filter).select('matiere').exec();

        // Extraire les identifiants uniques des matières
        const matiereIds = [...new Set(periodes.map(periode => periode.matiere))];

        // Récupérer les détails de chaque matière à partir des identifiants uniques
        matieres = await Matiere.find({ _id: { $in: matiereIds } })
                        // .populate({
                        //     path: 'typesEnseignement.enseignantPrincipal',
                        //     select: '_id nom prenom'
                        // })
                        // .populate({
                        //     path: 'typesEnseignement.enseignantSuppleant',
                        //     select: '_id nom prenom'
                        // })
                        .populate('chapitres')
                        .populate('objectifs');
    }else{
        matieres = await Matiere.find({})
                    .populate('chapitres')
                    .populate('objectifs');
    }
    
    let filePath='./templates/templates_fr/template_liste_matiere_fr.html';
               
    if(langue==='en'){
        filePath='./templates/templates_en/template_liste_matiere_en.html';
    }
    const htmlContent = await fillTemplateListMat(langue, departement, section, cycle, niveau, matieres, filePath, annee, semestre);

    // Générer le PDF à partir du contenu HTML
    generatePDFAndSendToBrowser(htmlContent, res, 'landscape');
    
    // Récupérer la liste des matières du niveau spécifié avec tous leurs détails
    // const matieres = await Matiere.find({niveau:niveauId}).populate({
    //     path: 'typesEnseignement.enseignantPrincipal',
    //     select: '_id nom prenom' // Sélectionnez les champs à afficher pour l'enseignant principal
    // }).populate({
    //     path: 'typesEnseignement.enseignantSuppleant',
    //     select: '_id nom prenom' // Sélectionnez les champs à afficher pour l'enseignant suppléant
    // }).populate('chapitres')
    // .populate('objectifs');
}

export const generateProgressByNiveau = async (req, res)=>{
    const {annee, semestre}=req.params;
    const { langue, departement, section, cycle, niveau } = req.query;
    const filter = { 
        niveau: niveau._id,
    };

    // Si une année est spécifiée dans la requête, l'utiliser
    if (annee && !isNaN(annee)) {
        filter.annee = parseInt(annee);
        // let periodesCurrentYear = await Periode.findOne(filter).exec();
        // if (!periodesCurrentYear) {
        //     // Si aucune période pour l'année actuelle, rechercher dans les années précédentes jusqu'à en trouver une
        //     let found = false;
        //     let previousYear = parseInt(annee) - 1;
        //     while (!found && previousYear >= 2023) { // Limite arbitraire de 2023 pour éviter une boucle infinie
        //         periodesCurrentYear = await Periode.findOne({ annee: previousYear, ...filter }).exec();
        //         if (periodesCurrentYear) {
        //             filter.annee = previousYear;
        //             found = true;
        //         } else {
        //             previousYear--;
        //         }
        //     }
        // } 
    }

    // Si un semestre est spécifié dans la requête, l'utiliser
    if (semestre && !isNaN(semestre)) {
        filter.semestre = parseInt(semestre);
    }

    

    // Rechercher les périodes en fonction du filtre
    const periodes = await Periode.find(filter).select('matiere').exec();

    // Extraire les identifiants uniques des matières
    const matiereIds = [...new Set(periodes.map(periode => periode.matiere))];

    // Récupérer les détails de chaque matière à partir des identifiants uniques
    const matieres = await Matiere.find({ _id: { $in: matiereIds } }).populate('objectifs').exec();
    
    let filePath='./templates/templates_fr/template_progression_matiere_fr.html';
    if(langue==='en'){
        filePath='./templates/templates_en/template_progression_matiere_en.html';
    }
    const htmlContent = await fillTemplate(langue, departement, section, cycle, niveau, matieres, filePath, annee, semestre);

    
    // Générer le PDF à partir du contenu HTML
    generatePDFAndSendToBrowser(htmlContent, res, 'portrait');

    // const niveauId = req.params.niveauId; // Supposons que le niveauId soit passé en tant que paramètre d'URL

    // // Récupérer la liste des matières du niveau spécifié avec tous leurs détails
    // const matieres = await Matiere.find({niveau:niveauId}).populate({
    //     path: 'typesEnseignement.enseignantPrincipal',
    //     select: '_id nom prenom' // Sélectionnez les champs à afficher pour l'enseignant principal
    // }).populate({
    //     path: 'typesEnseignement.enseignantSuppleant',
    //     select: '_id nom prenom' // Sélectionnez les champs à afficher pour l'enseignant suppléant
    // }).populate('chapitres')
    // .populate('objectifs');
    // const htmlContent = await fillTemplate(matieres, './templates/template_progression_matiere_fr.html', 2024);

}

export const getMatieresByNiveauWithPagination = async (req, res) => {
    const niveauId = req.params.niveauId;
    const { page = 1, pageSize = 10, annee, semestre } = req.query;
    
    try {
        const startIndex = (page - 1) * pageSize;
        if(niveauId && annee && semestre){ 
            // Récupération des matières avec pagination
            const filter = { 
                niveau: niveauId
            };

            // Si une année est spécifiée dans la requête, l'utiliser
            if (annee && !isNaN(annee)) {
                filter.annee = parseInt(annee);
                // let periodesCurrentYear = await Periode.findOne(filter).exec();
                // if (!periodesCurrentYear) {
                //     // Si aucune période pour l'année actuelle, rechercher dans les années précédentes jusqu'à en trouver une
                //     let found = false;
                //     let previousYear = parseInt(annee) - 1;
                //     while (!found && previousYear >= 2023) { // Limite arbitraire de 2023 pour éviter une boucle infinie
                //         periodesCurrentYear = await Periode.findOne({ annee: previousYear, ...filter }).exec();
                //         if (periodesCurrentYear) {
                //             filter.annee = previousYear;
                //             found = true;
                //         } else {
                //             previousYear--;
                //         }
                //     }
                // } 
            }

            // Si un semestre est spécifié dans la requête, l'utiliser
            if (semestre && !isNaN(semestre)) {
                filter.semestre = parseInt(semestre);
            }

            // Rechercher les périodes en fonction du filtre
            const periodes = await Periode.find(filter).select('matiere').exec();

            // Extraire les identifiants uniques des matières
            const matiereIds = [...new Set(periodes.map(periode => periode.matiere))];

            // Récupérer les détails de chaque matière à partir des identifiants uniques
            const matieres = await Matiere.find({ _id: { $in: matiereIds } })
                            .populate({
                                path: 'chapitres',
                                select: '_id typesEnseignement'
                            })
                            .sort({ libelleFr: 1}) 
                            .skip(startIndex)
                            .limit(parseInt(pageSize))
            // Comptage total des matières pour la pagination
            const totalMatiere = await Matiere.countDocuments({ _id: { $in: matiereIds } });
            const totalPages = Math.ceil(totalMatiere / parseInt(pageSize));

            res.status(200).json({ 
                success: true, 
                data:{
                    matieres,
                    totalPages: totalPages,
                    currentPage: page,
                    totalItems: totalMatiere,
                    pageSize:pageSize
                } 
                
            });
        }else{
            
            const matieres = await Matiere.find({}).populate({
                path: 'chapitres',
                select: '_id typesEnseignement'
            })
            
            .skip(startIndex)
            .limit(parseInt(pageSize));
            
            // Comptage total des matières pour la pagination
            const totalMatiere = await Matiere.countDocuments();
            const totalPages = Math.ceil(totalMatiere / parseInt(pageSize));
            res.status(200).json({ 
                success: true, 
                data:{
                    matieres,
                    totalPages: totalPages,
                    currentPage: page,
                    totalItems: totalMatiere,
                    pageSize:pageSize
                } 
                
            });
        }   


    } catch (error) {
        console.error('Erreur lors de la récupération des matières par niveau :', error);
        res.status(500).json({ success: false, message: message.erreurServeur });
    }
};

export const getMatieresByEnseignantNiveau = async (req, res) => {
    const niveauId = req.params.niveauId;
    const { enseignantId, annee, semestre } = req.query;

    try {
        // Récupération des matières avec pagination
        

        const filter = { 
            niveau: niveauId,
            $or: [
                { enseignantPrincipal: enseignantId },
                { enseignantSuppleant: enseignantId }
            ]
        };

        // Si une année est spécifiée dans la requête, l'utiliser
        if (annee && !isNaN(annee)) {
            filter.annee = parseInt(annee);
            // let periodesCurrentYear = await Periode.findOne(filter).exec();
            // if (!periodesCurrentYear) {
            //     // Si aucune période pour l'année actuelle, rechercher dans les années précédentes jusqu'à en trouver une
            //     let found = false;
            //     let previousYear = parseInt(annee) - 1;
            //     while (!found && previousYear >= 2023) { // Limite arbitraire de 2023 pour éviter une boucle infinie
            //         periodesCurrentYear = await Periode.findOne({ annee: previousYear, ...filter }).exec();
            //         if (periodesCurrentYear) {
            //             filter.annee = previousYear;
            //             found = true;
            //         } else {
            //             previousYear--;
            //         }
            //     }
            // } 
        }

        // Si un semestre est spécifié dans la requête, l'utiliser
        if (semestre && !isNaN(semestre)) {
            filter.semestre = parseInt(semestre);
        }

        

        // Rechercher les périodes en fonction du filtre
        const periodes = await Periode.find(filter).select('matiere').exec();

        // Extraire les identifiants uniques des matières
        const matiereIds = [...new Set(periodes.map(periode => periode.matiere))];

        // Récupérer les détails de chaque matière à partir des identifiants uniques
        const matieres = await Matiere.find({ _id: { $in: matiereIds } }).populate('chapitres').populate('objectifs').exec();
            

        res.status(200).json({ 
            success: true, 
            data:{
                matieres,
                totalPages: 0,
                currentPage: 0,
                totalItems: 0,
                pageSize: 0,
            } 
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des matières par niveau :', error);
        res.status(500).json({ success: false, message: 'Une erreur est survenue lors de la récupération des matières par niveau.' });
    }
};

export const generateListMatByEnseignantNiveau = async (req, res)=>{
    const niveauId = req.params.niveauId;
    const { enseignantId, annee, semestre,  langue, departement, section, cycle, niveau } = req.query;

    const filter = { 
        niveau: niveauId,
        $or: [
            { enseignantPrincipal: enseignantId },
            { enseignantSuppleant: enseignantId }
        ]
    };

    // Si une année est spécifiée dans la requête, l'utiliser
    if (annee && !isNaN(annee)) {
        filter.annee = parseInt(annee);
        // let periodesCurrentYear = await Periode.findOne(filter).exec();
        // if (!periodesCurrentYear) {
        //     // Si aucune période pour l'année actuelle, rechercher dans les années précédentes jusqu'à en trouver une
        //     let found = false;
        //     let previousYear = parseInt(annee) - 1;
        //     while (!found && previousYear >= 2023) { // Limite arbitraire de 2023 pour éviter une boucle infinie
        //         periodesCurrentYear = await Periode.findOne({ annee: previousYear, ...filter }).exec();
        //         if (periodesCurrentYear) {
        //             filter.annee = previousYear;
        //             found = true;
        //         } else {
        //             previousYear--;
        //         }
        //     }
        // } 
    }

    // Si un semestre est spécifié dans la requête, l'utiliser
    if (semestre && !isNaN(semestre)) {
        filter.semestre = parseInt(semestre);
    }

    

    // Rechercher les périodes en fonction du filtre
    const periodes = await Periode.find(filter).select('matiere').exec();

    // Extraire les identifiants uniques des matières
    const matiereIds = [...new Set(periodes.map(periode => periode.matiere))];

    // Récupérer les détails de chaque matière à partir des identifiants uniques
    const matieres = await Matiere.find({ _id: { $in: matiereIds } }).populate('chapitres').populate('objectifs').exec();

    let filePath='./templates/template_liste_matiere_fr.html';
    if(langue==='en'){
        filePath='./templates/template_liste_matiere_en.html';
    }
    const htmlContent = await fillTemplateListMat( langue, departement, section, cycle, niveau, matieres, filePath, annee, semestre);

    // Générer le PDF à partir du contenu HTML
    generatePDFAndSendToBrowser(htmlContent, res, 'landscape');
}

export const generateProgressByEnseignant = async (req, res)=>{
    const niveauId = req.params.niveauId;
    const { enseignantId, annee, semestre, langue, departement, section, cycle, niveau } = req.query;

    const filter = { 
        niveau: niveauId,
        $or: [
            { enseignantPrincipal: enseignantId },
            { enseignantSuppleant: enseignantId }
        ]
    };

    // Si une année est spécifiée dans la requête, l'utiliser
    if (annee && !isNaN(annee)) {
        filter.annee = parseInt(annee);
        // let periodesCurrentYear = await Periode.findOne(filter).exec();
        // if (!periodesCurrentYear) {
        //     // Si aucune période pour l'année actuelle, rechercher dans les années précédentes jusqu'à en trouver une
        //     let found = false;
        //     let previousYear = parseInt(annee) - 1;
        //     while (!found && previousYear >= 2023) { // Limite arbitraire de 2023 pour éviter une boucle infinie
        //         periodesCurrentYear = await Periode.findOne({ annee: previousYear, ...filter }).exec();
        //         if (periodesCurrentYear) {
        //             filter.annee = previousYear;
        //             found = true;
        //         } else {
        //             previousYear--;
        //         }
        //     }
        // } 
    }

    // Si un semestre est spécifié dans la requête, l'utiliser
    if (semestre && !isNaN(semestre)) {
        filter.semestre = parseInt(semestre);
    }

    

    // Rechercher les périodes en fonction du filtre
    const periodes = await Periode.find(filter).select('matiere').exec();

    // Extraire les identifiants uniques des matières
    const matiereIds = [...new Set(periodes.map(periode => periode.matiere))];

    // Récupérer les détails de chaque matière à partir des identifiants uniques
    const matieres = await Matiere.find({ _id: { $in: matiereIds } }).populate('chapitres').populate('objectifs').exec();
    
    let filePath='./templates/template_progression_matiere_fr.html';
    if(langue==='en'){
        filePath='./templates/template_progression_matiere_en.html';
    }
    const htmlContent = await fillTemplate(langue, departement, section, cycle, niveau, matieres, filePath, annee, semestre);

    // Générer le PDF à partir du contenu HTML
    generatePDFAndSendToBrowser(htmlContent, res, 'portrait');
}

async function fillTemplateListMat (langue, departement, section, cycle, niveau, matieres, filePath, annee, semestre) {
    try {
        const htmlString = await loadHTML(filePath);
        const $ = cheerio.load(htmlString); // Charger le template HTML avec cheerio
        const body = $('body');
        if(departement){
            body.find('#division-fr').text(departement.libelleFr);
            body.find('#division-en').text(departement.libelleEn);
        }else{
            body.find('.division').remove();
        }
        
        if(section){
            body.find('#section-fr').text(section.libelleFr);
            body.find('#section-en').text(section.libelleEn);
        }
        
        if(cycle){
            body.find('#cycle-niveau').text(cycle.code+""+niveau.code);
        }
        
        body.find('#annee').text(formatYear(parseInt(annee)));
        if(semestre){
            body.find('#semestre').text(semestre);
        }
        
        const userTable = $('#table-matiere');
        const matTemplate=$('.matiere_template');
        const appTemplate=$('.app_template');
        const preTemplate=$('.pre_template');
        const evaTemplate=$('.eva_template');
        const compTemplate=$('.comp_template');
        const rowTemplate = $('.row_template');
        let settings = await Setting.find().select('typesEnseignement');
        let setting = null;
        if(settings.length>0){
            setting=settings[0]
        }
        for (const matiere of matieres) {
            const clonedRowMat = matTemplate.clone();
            clonedRowMat.find('#title-matiere').text(langue==='fr'?matiere.libelleFr:matiere.libelleEn);
            userTable.append(clonedRowMat);
            
            if(matiere.chapitres){
                for(const chapitre of matiere.chapitres){
                    const clonedRow = rowTemplate.clone();
                    clonedRow.find('#title-chapitre').text(langue==='fr'?chapitre.libelleFr:chapitre.libelleEn);
                    if(chapitre.typesEnseignement!=null && setting){
                        for(const typeEns of chapitre.typesEnseignement){
                            let type = setting.typesEnseignement.find(type=>type._id.toString()===typeEns.typeEnseignement.toString()).code.toString().toLowerCase();
                            if(type){
                                clonedRow.find('#'+type).text(typeEns.volumeHoraire);
                            }
                            
                            // if(setting.typeEnseignement.find(type=>type._id.toString()===typeEns.typeEnseignement.toString()).code.toString().toLowerCase()==='cm'){
                            //     clonedRow.find('#cm').text(typeEns.volumeHoraire);
                            // }
                            // if(setting.typeEnseignement.find(type=>type._id.toString()===typeEns.typeEnseignement.toString()).libelleFr.toString().toLowerCase()==='td'){
                            //     clonedRow.find('#td').text(typeEns.volumeHoraire);
                            // }
                            userTable.append(clonedRow);
                        }

                    }
                }
            }

            const clonedRowApp = appTemplate.clone();
            clonedRowApp.find('#approche-ped').text(langue==='fr'?matiere.approchePedFr:matiere.approchePedEn)
            userTable.append(clonedRowApp);

            const clonedRowPre = preTemplate.clone();
            clonedRowPre.find('#prerequis').text(langue==='fr'?matiere.prerequisFr:matiere.prerequisEn)
            userTable.append(clonedRowPre);

            const clonedRowEva = evaTemplate.clone();
            clonedRowEva.find('#evaluation').text(langue==='fr'?matiere.evaluationAcquisFr:matiere.evaluationAcquisEn)
            userTable.append(clonedRowEva);
            let objectifs="";
            if(matiere.objectifs){
                for(const objectif of matiere.objectifs){
                    if (objectifs.length > 0) {
                        objectifs = objectifs + "," +langue==='fr'?objectif.libelleFr:objectif.libelleEn;
                    } else {
                        objectifs = langue==='fr'?objectif.libelleFr:objectif.libelleEn;
                    }
                }
            }

            const clonedRowComp = compTemplate.clone();
            clonedRowComp.find('#competence').text(objectifs)
            userTable.append(clonedRowComp);
            
            
            
        }
        matTemplate.first().remove();
        appTemplate.first().remove();
        preTemplate.first().remove();
        evaTemplate.first().remove();
        compTemplate.first().remove();
        rowTemplate.first().remove();

        return $.html(); // Récupérer le HTML mis à jour
    } catch (error) {
        console.error('Erreur lors du remplissage du template :', error);
        return '';
    }
};

async function fillTemplate (langue, departement, section, cycle, niveau, matieres, filePath, annee, semestre) {
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
        
        const userTable = $('#table-progression');
        const rowTemplate = $('.row_template');
        
        for (const matiere of matieres) {
            const clonedRow = rowTemplate.clone();
            clonedRow.find('#matiere').text(langue==='fr'?matiere.libelleFr:matiere.libelleEn);
            clonedRow.find('#progression').text(calculateProgress(matiere, annee, semestre)+" %");
            userTable.append(clonedRow);
        }
        rowTemplate.first().remove();

        return $.html(); // Récupérer le HTML mis à jour
    } catch (error) {
        console.error('Erreur lors du remplissage du template :', error);
        return '';
    }
};


export const searchMatiere = async (req, res) => {
    const { langue, searchString } = req.params; // Récupère la chaîne de recherche depuis les paramètres de requête
    // console.log(searchString);
    try {
        // Construire la requête pour filtrer les matières
        let query = {
             libelleFr: { $regex: `^${searchString}`, $options: 'i' } 
        }
        if(langue!=='fr'){
            query = {
                libelleEn: { $regex: `^${searchString}`, $options: 'i' } 
            }
        }

        const matieres = await Matiere.find(query)
            .select("_id libelleFr libelleEn typesEnseignement")
            .sort({ libelleFr: 1, libelleEn: 1 }) 
            .limit(5); // Limite à 5 résultats

        res.json({
            success: true,
            data: {
                matieres,
                currentPage: 0,
                totalPages: 1,
                totalItems: matieres.length,
                pageSize: 10,
            }
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des matières :', error);
        res.status(500).json({ success: false, message: 'Une erreur est survenue sur le serveur.' });
    }
};

async function lireDonneesFichierWord(fichier, fichierEn) {
    const data = await extractRawText({ path: fichier });
    const dataEn = await extractRawText({ path: fichierEn });
    const text = data.value;
    const textEn = dataEn.value;
    
    // Structure pour stocker les données
    const donnees = [];
    let currentMatiere = null;
    let captureNextLines = false;
    let captureNextLinesAcquis = false; 

    // Split text into lines
    const lines = text.split('\n');
    const linesEn = textEn.split('\n');
    
    lines.forEach((line, index) => {
        line = line.trim();
        
        if (line.length === 0) return;

        // Détecter la section "Compétences acquises"
        if (line.startsWith('Compétences acquises')) {
            captureNextLines = true;
            return; // Skip the "Compétences acquises" line
        }

        if (line.startsWith('Prérequis') && currentMatiere) {
            captureNextLinesAcquis = true;
            return; // Skip the "Compétences acquises" line
        }



        // Si on doit capturer les lignes après "Compétences acquises"
        if (captureNextLines) {
            // Les titres des matières
           
            currentMatiere = {
                libelleFr: line,
                libelleEn: linesEn[index],
                prerequisFr:"",
                prerequisEn:"",
                approchePedFr:"",
                approchePedEn:"",
                evaluationAcquisFr: "",
                evaluationAcquisEn:"",
                typesEnseignement:[],
                chapitres:[],
                objectifs:[],
            };
            captureNextLines=false;
        }

        if(captureNextLinesAcquis){
            currentMatiere.evaluationAcquisFr = line.replace("Evaluation des acquis :", "").trim();
            currentMatiere.evaluationAcquisEn = linesEn[index].replace("Knowledge assessment :", "").trim();
            captureNextLinesAcquis=false;
            donnees.push(currentMatiere);
        }
    });
    
    console.log(donnees);
    return donnees;
}

export const createManyMatiere = async (req, res) => {
    try {
        const filePath = './maquette_fr.docx';
        const filePathEn = './maquette_en.docx';
        
        const donnees = await lireDonneesFichierWord(filePath,filePathEn);
        await Matiere.insertMany(donnees);
        res.status(200).send('Données insérées avec succès dans MongoDB');
        

    } catch(e) {
        console.log(e);
    }
}

export const updateMatiereTypeEns = async (req, res) => {

    try {
        // Vérifier si l'ID de la matière est un ObjectId valide
        // if (!mongoose.Types.ObjectId.isValid(matiereId)) {
        //     return res.status(400).json({ 
        //         success: false, 
        //         message: message.identifiant_invalide
        //     });
        // }

        // Récupérer toutes les matières de la base de données
        const matieres = await Matiere.find({});
        const typesEnseignement =['660238e437b0ee5bea8089ce','66023adcd4b5f4df62c2d219','66023b02d4b5f4df62c2d255']
        // Parcourir chaque matière et mettre à jour les types d'enseignement
        for (const matiere of matieres) {
            matiere.typesEnseignement = typesEnseignement;
            await matiere.save();
        }

        res.status(200).json({ 
            success: true, 
            message: message.mis_a_jour,
            data: matieres
        });
    } catch (error) {
        console.error('Erreur lors de la mise à jour de la matière :', error);
        res.status(500).json({ 
            success: false, 
            message: message.erreurServeur 
        });
    }
}



// read
export const readMatiere = async (req, res) => { }


export const readMatieres = async (req, res) => { }


