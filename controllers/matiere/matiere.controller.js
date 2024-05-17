import Matiere from '../../models/matiere.model.js'
import Periode from '../../models/periode.model.js'
import Chapitre from '../../models/chapitre.model.js'
import { message } from '../../configs/message.js';
import mongoose from 'mongoose';
import Setting from '../../models/setting.model.js';
import { calculateProgress, formatYear, generatePDFAndSendToBrowser, loadHTML } from '../../fonctions/fonctions.js';
import cheerio from 'cheerio';

// create
export const createMatiere = async (req, res) => { 
    const { code, libelleFr, libelleEn, niveau, prerequisFr, prerequisEn, approchePedFr, approchePedEn, evaluationAcquisFr, evaluationAcquisEn, typesEnseignement, chapitres, objectifs } = req.body;

    try {

        // Vérifier que tous les champs obligatoires sont présents
        if (!code || !libelleFr || !libelleEn || !niveau || !typesEnseignement) {
            return res.status(400).json({ success: false, message: message.champ_obligatoire });
        }

        // Vérifier si les ObjectId pour les références existent
        if (!mongoose.Types.ObjectId.isValid(niveau)) {
            return res.status(400).json({ 
                success: false, 
                message: message.identifiant_invalide
            });
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
        const existingCode = await Matiere.findOne({ code: code });
        if (existingCode) {
            return res.status(400).json({
                success: false,
                message: message.existe_code
            });
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
            niveau,
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
    const { code, libelleFr, libelleEn, niveau, prerequisFr, prerequisEn, approchePedFr, approchePedEn, evaluationAcquisFr, evaluationAcquisEn, typesEnseignement, chapitres, objectifs } = req.body;

    try {
        // Vérifier que tous les champs obligatoires sont présents
        if (!code || !libelleFr || !libelleEn || !niveau || !typesEnseignement) {
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
        if (existingMatiere.code !== code) {
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
        existingMatiere.niveau = niveau;
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
        const updatedEnseignements = await Matiere.findById(updatedMatiere._id)
                                    .populate('typesEnseignement.enseignantPrincipal', '_id nom prenom')
                                    .populate('typesEnseignement.enseignantSuppleant', '_id nom prenom');

        res.status(200).json({ 
            success: true, 
            message: message.mis_a_jour,
            data: updatedEnseignements
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
    const niveauId = req.params.niveauId; // Supposons que le niveauId soit passé en tant que paramètre d'URL
    const {annee, semestre}=req.query;

    try {

        const filter = { 
            niveau: niveauId
        };

        // Si une année est spécifiée dans la requête, l'utiliser
        if (annee && !isNaN(annee)) {
            filter.annee = parseInt(annee);
            let periodesCurrentYear = await Periode.findOne(filter).exec();
            if (!periodesCurrentYear) {
                // Si aucune période pour l'année actuelle, rechercher dans les années précédentes jusqu'à en trouver une
                let found = false;
                let previousYear = parseInt(annee) - 1;
                while (!found && previousYear >= 2023) { // Limite arbitraire de 2023 pour éviter une boucle infinie
                    periodesCurrentYear = await Periode.findOne({ annee: previousYear, ...filter }).exec();
                    if (periodesCurrentYear) {
                        filter.annee = previousYear;
                        found = true;
                    } else {
                        previousYear--;
                    }
                }
            } 
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
                            path: 'typesEnseignement.enseignantPrincipal',
                            select: '_id nom prenom'
                        })
                        .populate({
                            path: 'typesEnseignement.enseignantSuppleant',
                            select: '_id nom prenom'
                        })
                        .populate('chapitres')
                        .populate('objectifs');

        // Récupérer la liste des matières du niveau spécifié avec tous leurs détails
        // const matieres = await Matiere.find({niveau:niveauId}).populate({
        //     path: 'typesEnseignement.enseignantPrincipal',
        //     select: '_id nom prenom' // Sélectionnez les champs à afficher pour l'enseignant principal
        // }).populate({
        //     path: 'typesEnseignement.enseignantSuppleant',
        //     select: '_id nom prenom' // Sélectionnez les champs à afficher pour l'enseignant suppléant
        // }).populate('chapitres')
        // .populate('objectifs');
        
        

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
    } catch (error) {
        console.error('Erreur lors de la récupération des matières par niveau :', error);
        res.status(500).json({ success: false, message: message.erreurServeur });
    }
};

export const generateListMatByNiveau = async (req, res)=>{
    const {annee, semestre} = req.params; 
    const { langue, departement, section, cycle, niveau}=req.query;

    const filter = { 
        niveau: niveau._id
    };

    // Si une année est spécifiée dans la requête, l'utiliser
    if (annee && !isNaN(annee)) {
        filter.annee = parseInt(annee);
        let periodesCurrentYear = await Periode.findOne(filter).exec();
        if (!periodesCurrentYear) {
            // Si aucune période pour l'année actuelle, rechercher dans les années précédentes jusqu'à en trouver une
            let found = false;
            let previousYear = parseInt(annee) - 1;
            while (!found && previousYear >= 2023) { // Limite arbitraire de 2023 pour éviter une boucle infinie
                periodesCurrentYear = await Periode.findOne({ annee: previousYear, ...filter }).exec();
                if (periodesCurrentYear) {
                    filter.annee = previousYear;
                    found = true;
                } else {
                    previousYear--;
                }
            }
        } 
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
                        path: 'typesEnseignement.enseignantPrincipal',
                        select: '_id nom prenom'
                    })
                    .populate({
                        path: 'typesEnseignement.enseignantSuppleant',
                        select: '_id nom prenom'
                    })
                    .populate('chapitres')
                    .populate('objectifs');
    let filePath='./templates/template_liste_matiere_fr.html';
               
    if(langue==='en'){
        filePath='./templates/template_liste_matiere_en.html';
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
        let periodesCurrentYear = await Periode.findOne(filter).exec();
        if (!periodesCurrentYear) {
            // Si aucune période pour l'année actuelle, rechercher dans les années précédentes jusqu'à en trouver une
            let found = false;
            let previousYear = parseInt(annee) - 1;
            while (!found && previousYear >= 2023) { // Limite arbitraire de 2023 pour éviter une boucle infinie
                periodesCurrentYear = await Periode.findOne({ annee: previousYear, ...filter }).exec();
                if (periodesCurrentYear) {
                    filter.annee = previousYear;
                    found = true;
                } else {
                    previousYear--;
                }
            }
        } 
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
        

        // Récupération des matières avec pagination
        const startIndex = (page - 1) * pageSize;
       
        const filter = { 
            niveau: niveauId
        };

        // Si une année est spécifiée dans la requête, l'utiliser
        if (annee && !isNaN(annee)) {
            filter.annee = parseInt(annee);
            let periodesCurrentYear = await Periode.findOne(filter).exec();
            if (!periodesCurrentYear) {
                // Si aucune période pour l'année actuelle, rechercher dans les années précédentes jusqu'à en trouver une
                let found = false;
                let previousYear = parseInt(annee) - 1;
                while (!found && previousYear >= 2023) { // Limite arbitraire de 2023 pour éviter une boucle infinie
                    periodesCurrentYear = await Periode.findOne({ annee: previousYear, ...filter }).exec();
                    if (periodesCurrentYear) {
                        filter.annee = previousYear;
                        found = true;
                    } else {
                        previousYear--;
                    }
                }
            } 
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
                            path: 'typesEnseignement.enseignantPrincipal',
                            select: '_id nom prenom'
                        })
                        .populate({
                            path: 'typesEnseignement.enseignantSuppleant',
                            select: '_id nom prenom'
                        })
                        .populate('chapitres')
                        .populate('objectifs')
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

         // const matieres = await Matiere.find({ niveau: niveauId })
        //     .populate({
        //         path: 'typesEnseignement.enseignantPrincipal',
        //         select: '_id nom prenom'
        //     })
        //     .populate({
        //         path: 'typesEnseignement.enseignantSuppleant',
        //         select: '_id nom prenom'
        //     })
        //     .populate('chapitres')
        //     .populate('objectifs')
        //     .skip(startIndex)
        //     .limit(parseInt(pageSize));
            
        // // Comptage total des matières pour la pagination
        // const totalMatiere = await Matiere.countDocuments({ niveau: niveauId });
        // const totalPages = Math.ceil(totalMatiere / parseInt(pageSize));

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
            let periodesCurrentYear = await Periode.findOne(filter).exec();
            if (!periodesCurrentYear) {
                // Si aucune période pour l'année actuelle, rechercher dans les années précédentes jusqu'à en trouver une
                let found = false;
                let previousYear = parseInt(annee) - 1;
                while (!found && previousYear >= 2023) { // Limite arbitraire de 2023 pour éviter une boucle infinie
                    periodesCurrentYear = await Periode.findOne({ annee: previousYear, ...filter }).exec();
                    if (periodesCurrentYear) {
                        filter.annee = previousYear;
                        found = true;
                    } else {
                        previousYear--;
                    }
                }
            } 
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
        let periodesCurrentYear = await Periode.findOne(filter).exec();
        if (!periodesCurrentYear) {
            // Si aucune période pour l'année actuelle, rechercher dans les années précédentes jusqu'à en trouver une
            let found = false;
            let previousYear = parseInt(annee) - 1;
            while (!found && previousYear >= 2023) { // Limite arbitraire de 2023 pour éviter une boucle infinie
                periodesCurrentYear = await Periode.findOne({ annee: previousYear, ...filter }).exec();
                if (periodesCurrentYear) {
                    filter.annee = previousYear;
                    found = true;
                } else {
                    previousYear--;
                }
            }
        } 
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
        let periodesCurrentYear = await Periode.findOne(filter).exec();
        if (!periodesCurrentYear) {
            // Si aucune période pour l'année actuelle, rechercher dans les années précédentes jusqu'à en trouver une
            let found = false;
            let previousYear = parseInt(annee) - 1;
            while (!found && previousYear >= 2023) { // Limite arbitraire de 2023 pour éviter une boucle infinie
                periodesCurrentYear = await Periode.findOne({ annee: previousYear, ...filter }).exec();
                if (periodesCurrentYear) {
                    filter.annee = previousYear;
                    found = true;
                } else {
                    previousYear--;
                }
            }
        } 
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
        body.find('#division-fr').text(departement.libelleFr);
        body.find('#division-en').text(departement.libelleEn);
        body.find('#section-fr').text(section.libelleFr);
        body.find('#section-en').text(section.libelleEn);
        body.find('#cycle-niveau').text(cycle.code+""+niveau.code);
        body.find('#annee').text(formatYear(parseInt(annee)));
        body.find('#semestre').text(semestre);
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
            clonedRowMat.find('#title-matiere').text(matiere.libelleFr);
            userTable.append(clonedRowMat);
            
            if(matiere.chapitres){
                for(const chapitre of matiere.chapitres){
                    const clonedRow = rowTemplate.clone();
                    clonedRow.find('#title-chapitre').text(chapitre.libelleFr);
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
            clonedRowApp.find('#approche-ped').text(matiere.approchePedFr)
            userTable.append(clonedRowApp);

            const clonedRowPre = preTemplate.clone();
            clonedRowPre.find('#prerequis').text(matiere.prerequisFr)
            userTable.append(clonedRowPre);

            const clonedRowEva = evaTemplate.clone();
            clonedRowEva.find('#evaluation').text(matiere.evaluationAcquisFr)
            userTable.append(clonedRowEva);
            let objectifs="";
            if(matiere.objectifs){
                for(const objectif of matiere.objectifs){
                    if (objectifs.length > 0) {
                        objectifs = objectifs + "," +objectif.libelleFr;
                    } else {
                        objectifs = objectif.libelleFr;
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
            clonedRow.find('#matiere').text(matiere.code+":"+matiere.libelleFr);
            clonedRow.find('#progression').text(calculateProgress(matiere)+" %");
            userTable.append(clonedRow);
        }
        rowTemplate.first().remove();

        return $.html(); // Récupérer le HTML mis à jour
    } catch (error) {
        console.error('Erreur lors du remplissage du template :', error);
        return '';
    }
};




// read
export const readMatiere = async (req, res) => { }


export const readMatieres = async (req, res) => { }


