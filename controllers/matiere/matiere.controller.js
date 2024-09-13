import Matiere from '../../models/matiere.model.js'
import Periode from '../../models/periode.model.js'
import Chapitre from '../../models/chapitre.model.js'
import { message } from '../../configs/message.js';
import mongoose from 'mongoose';
import Setting from '../../models/setting.model.js';
import { calculateProgress, calculateProgressChapitre, formatYear, generatePDFAndSendToBrowser, loadHTML } from '../../fonctions/fonctions.js';
import cheerio from 'cheerio';
import { extractRawText } from 'mammoth';
import ExcelJS from 'exceljs'

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
    const {annee, semestre, langue}=req.query;

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
            let matieres = [];
            if(langue==='fr'){
                matieres = await Matiere.find({ _id: { $in: matiereIds } }).sort({libelleFr:1}).populate('chapitres').populate('objectifs');
            }else{
                matieres = await Matiere.find({ _id: { $in: matiereIds } }).sort({libelleEn:1}).populate('chapitres').populate('objectifs');
            }
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
            let matieres = [];
            if(langue==='fr'){
                matieres = await Matiere.find({}).sort({libelleFr:1}).populate('chapitres').populate('objectifs');
            }else{
                matieres = await Matiere.find({}).sort({libelleEn:1}).populate('chapitres').populate('objectifs');
            }
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
    const { langue, departement, section, cycle, niveau, fileType}=req.query;
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
        if(langue==='fr'){
            matieres = await Matiere.find({ _id: { $in: matiereIds } })
                        .sort({libelleFr:1})
                        .populate('chapitres')
                        .populate('objectifs');
        }else{
            matieres = await Matiere.find({ _id: { $in: matiereIds } })
                        .sort({libelleEn:1})
                        .populate('chapitres')
                        .populate('objectifs');
        }
    }else{
        if(langue==='fr'){
            matieres = await Matiere.find({})
                    .sort({libelleFr:1})
                    .populate('chapitres')
                    .populate('objectifs');
        }else{
            matieres = await Matiere.find({})
                    .sort({libelleEn:1})
                    .populate('chapitres')
                    .populate('objectifs');
        }
        
    }
    
    if(fileType.toLowerCase() === 'pdf'){
        let filePath='./templates/templates_fr/template_liste_matiere_fr.html';
                
        if(langue==='en'){
            filePath='./templates/templates_en/template_liste_matiere_en.html';
        }
        const htmlContent = await fillTemplateListMat(langue, departement, section, cycle, niveau, matieres, filePath, annee, semestre);

        // Générer le PDF à partir du contenu HTML
        generatePDFAndSendToBrowser(htmlContent, res, 'landscape');
    }else{
        exportToExcel(matieres, annee, semestre, langue, res, section, cycle, niveau);
    }
    
   
}

const exportToExcel = async (matieres, annee, semestre, langue, res, section, cycle, niveau) => {
    if (matieres) {
        // Créer un nouveau classeur Excel
        const workbook = new ExcelJS.Workbook();
        // Ajouter une nouvelle feuille de calcul
        const worksheet = workbook.addWorksheet('Sheet1');

        // Ajouter les en-têtes à la feuille de calcul
        if(section && cycle && niveau){
            const sect = langue === 'fr'?section.libelleFr:section.libelleEn
            worksheet.addRow([
                sect+" "+cycle.code+niveau.code
            ]);
        }
       
        worksheet.addRow([
            langue === 'fr' ? 'Matières' : 'Subjects', 'CM', 'TD', 'TP'
        ]);

        // Parcourir chaque matière et ajouter les données associées
        matieres.forEach(matiere => {
            const rows = [];

            // Vérifier si matiere.chapitres est défini
            if (matiere.chapitres) {
                rows.push([langue === 'fr' ? matiere.libelleFr : matiere.libelleEn]);

                // Parcourir les chapitres
                matiere.chapitres.forEach(chapitre => {
                    if (chapitre.annee == annee && chapitre.semestre == semestre) {
                        rows.push([
                            langue === 'fr' ? chapitre.libelleFr : chapitre.libelleEn,
                            chapitre.typesEnseignement.length > 0 ? chapitre.typesEnseignement[0].volumeHoraire : "", // Volume horaire pour le premier type d'enseignement
                            chapitre.typesEnseignement.length > 1 ? chapitre.typesEnseignement[1].volumeHoraire : "", // Volume horaire pour le deuxième type d'enseignement
                            chapitre.typesEnseignement.length > 2 ? chapitre.typesEnseignement[2].volumeHoraire : ""  // Volume horaire pour le troisième type d'enseignement
                        ]);
                    }
                });
            }

            // Ajouter l'approche pédagogique, les prérequis, l'évaluation des acquis, et les compétences acquises
            rows.push([
                (langue === 'fr' ? 'Approche pédagogique' : 'Pedagogical Approach') + ": " + (langue === 'fr' ? matiere.approchePedFr : matiere.approchePedEn)
            ]);
            rows.push([
                (langue === 'fr' ? 'Prérequis' : 'Prerequisites') + ": " + (langue === 'fr' ? matiere.prerequisFr : matiere.prerequisEn)
            ]);
            rows.push([
                (langue === 'fr' ? 'Évaluation des acquis' : 'Assessment of Acquired Skills') + ": " + (langue === 'fr' ? matiere.evaluationAcquisFr : matiere.evaluationAcquisEn)
            ]);

            // Ajouter les compétences acquises
            let objectifs = "";
            if (matiere.objectifs) {
                matiere.objectifs.forEach(objectif => {
                    if (objectif.annee == annee && objectif.semestre == semestre) {
                        if (objectifs.length > 0) {
                            objectifs += ";" + (langue === 'fr' ? objectif.libelleFr : objectif.libelleEn);
                        } else {
                            objectifs = (langue === 'fr' ? objectif.libelleFr : objectif.libelleEn);
                        }
                    }
                });
            }
            rows.push([
                (langue === 'fr' ? 'Compétences acquises' : 'Acquired Competences') + ": " + objectifs
            ]);

            // Ajouter les lignes à la feuille de calcul
            rows.forEach(row => worksheet.addRow(row));
            worksheet.addRow(Array(4).fill("")); // Espacement entre les matières
        });

        // Définir les en-têtes de réponse pour le téléchargement du fichier
        res.setHeader('Content-Disposition', `attachment; filename=maquette_pedagogique_${langue}.xlsx`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        // Envoyer le fichier Excel en réponse
        await workbook.xlsx.write(res);
        res.end(); // Terminer la réponse après l'écriture du fichier
    } else {
        res.status(400).json({ success: false, message: message.pas_de_donnees });
    }
};

export const getMatieresByNiveauWithPagination = async (req, res) => {
    const niveauId = req.params.niveauId;
    const { page = 1, pageSize = 10, annee, semestre, langue } = req.query;
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
            let matieres = [];
            if(langue==='fr'){
                
                matieres = await Matiere.find({ _id: { $in: matiereIds } })
                            .sort({libelleFr:1})
                            .populate({
                                path: 'chapitres',
                                select: '_id typesEnseignement annee semestre'
                            })
                            .skip(startIndex)
                            .limit(parseInt(pageSize))
            }else{
                matieres = await Matiere.find({ _id: { $in: matiereIds } })
                            .sort({libelleEn:1})
                            .populate({
                                path: 'chapitres',
                                select: '_id typesEnseignement annee semestre'
                            })
                            .skip(startIndex)
                            .limit(parseInt(pageSize))
            }
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
            
            let matieres = [];
            if(langue === 'fr'){
                matieres = await Matiere.find({}).populate({
                    path: 'chapitres',
                    select: '_id typesEnseignement annee semestre'
                })
                .sort({libelleFr:1})
                .skip(startIndex)
                .limit(parseInt(pageSize));
            }else{
                matieres = await Matiere.find({}).populate({
                    path: 'chapitres',
                    select: '_id typesEnseignement annee semestre'
                })
                .sort({libelleEn:1})
                .skip(startIndex)
                .limit(parseInt(pageSize));
            }
            
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
    const { enseignantId, annee, semestre, langue } = req.query;

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
        let matieres = [];
        if(langue==='fr'){
            matieres = await Matiere.find({ _id: { $in: matiereIds } }).sort({libelleFr:1}).populate('chapitres').populate('objectifs').exec();
        }else{
            matieres = await Matiere.find({ _id: { $in: matiereIds } }).sort({libelleEn:1}).populate('chapitres').populate('objectifs').exec();
        }
            

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
    const { enseignantId, annee, semestre,  langue, departement, section, cycle, niveau, fileType } = req.query;

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
    let matieres = [];
    if(langue === 'fr'){
        matieres = await Matiere.find({ _id: { $in: matiereIds } }).sort({libelleFr:1}).populate('chapitres').populate('objectifs').exec();
    }else{
        matieres = await Matiere.find({ _id: { $in: matiereIds } }).sort({libelleEn:1}).populate('chapitres').populate('objectifs').exec();
    }

    if(fileType.toLowerCase() === 'pdf'){
        let filePath='./templates/templates_fr/template_liste_matiere_fr.html';
        if(langue==='en'){
            filePath='./templates/templates_en/template_liste_matiere_en.html';
        }
        const htmlContent = await fillTemplateListMat( langue, departement, section, cycle, niveau, matieres, filePath, annee, semestre);

        // Générer le PDF à partir du contenu HTML
        generatePDFAndSendToBrowser(htmlContent, res, 'landscape');
    }else{
        exportToExcel(matieres, annee, semestre, langue, res);
    }
}

export const generateProgressByNiveau = async (req, res)=>{
    const {annee, semestre}=req.params;
    const { langue, departement, section, cycle, niveau, fileType } = req.query;
    const filter = { 
        niveau: niveau._id,
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
    let matieres = [];
    if(langue==='fr'){
        matieres =await Matiere.find({ _id: { $in: matiereIds } }).sort({libelleFr:1}).populate('objectifs').exec();
    }else{
        matieres =await Matiere.find({ _id: { $in: matiereIds } }).sort({libelleEn:1}).populate('objectifs').exec();
    }
    
    if(fileType.toLowerCase() === 'pdf'){
        let filePath='./templates/templates_fr/template_progression_matiere_fr.html';
        if(langue==='en'){
            filePath='./templates/templates_en/template_progression_matiere_en.html';
        }
        const htmlContent = await fillTemplate(langue, departement, section, cycle, niveau, matieres, filePath, annee, semestre);
    
    
        // Générer le PDF à partir du contenu HTML
        generatePDFAndSendToBrowser(htmlContent, res, 'portrait');
    }else{
         // Créer un nouveau classeur Excel
         const workbook = new ExcelJS.Workbook();
         const worksheet = workbook.addWorksheet('Sheet1');
 
         // Ajouter les en-têtes de colonnes
         if(langue==='fr'){
             worksheet.addRow(['Matieres', 'Progression']);
         }else{
             worksheet.addRow(['Subjects', 'Progression']);
         }
 
         // Ajouter les données des matières
         for (const matiere of matieres) {
             const progress = calculateProgress(matiere, annee, semestre) ; // Remplacez cette logique par votre propre logique pour obtenir la progression
             worksheet.addRow([matiere.libelleFr || matiere.libelleEn, `${progress}%`]);
         }
 
         // Définir le type de contenu pour le téléchargement du fichier
         res.setHeader('Content-Disposition', `attachment; filename=progression_par_objectif_matiere_${langue}.xlsx`);
         res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
 
         // Envoyer le fichier Excel en réponse
         await workbook.xlsx.write(res);
    }

}

export const generateProgressChapitreByNiveau = async (req, res)=>{
    const {annee, semestre}=req.params;
    const { langue, departement, section, cycle, niveau, fileType, filename } = req.query;
    const filter = { 
        niveau: niveau._id,
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
    let matieres = [];
    if(langue==='fr'){
        matieres =await Matiere.find({ _id: { $in: matiereIds } }).sort({libelleFr:1}).populate('chapitres').exec();
    }else{
        matieres =await Matiere.find({ _id: { $in: matiereIds } }).sort({libelleEn:1}).populate('chapitres').exec();
    }
    
    if(fileType==='PDF'){
        let filePath='./templates/templates_fr/template_progression_chapitre_matiere_fr.html';
        if(langue==='en'){
            filePath='./templates/templates_en/template_progression_chapitre_matiere_en.html';
        }
        const htmlContent = await fillTemplateChapitre(langue, departement, section, cycle, niveau, matieres, filePath, annee, semestre);


        // Générer le PDF à partir du contenu HTML
        generatePDFAndSendToBrowser(htmlContent, res, 'portrait');
    }else{
        // Créer un nouveau classeur Excel
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Sheet1');

        // Ajouter les en-têtes de colonnes
        if(langue==='fr'){
            worksheet.addRow(['Matieres', 'Progression']);
        }else{
            worksheet.addRow(['Subjects', 'Progression']);
        }

        // Ajouter les données des matières
        for (const matiere of matieres) {
            const progress = calculateProgressChapitre(matiere, annee, semestre) ; // Remplacez cette logique par votre propre logique pour obtenir la progression
            worksheet.addRow([matiere.libelleFr || matiere.libelleEn, `${progress}%`]);
        }

        // Définir le type de contenu pour le téléchargement du fichier
        res.setHeader('Content-Disposition', `attachment; filename=progression_par_chapitre_matiere_${langue}.xlsx`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        // Envoyer le fichier Excel en réponse
        await workbook.xlsx.write(res);
    }


}


export const generateProgressByEnseignant = async (req, res)=>{
    const niveauId = req.params.niveauId;
    const { enseignantId, annee, semestre, langue, departement, section, cycle, niveau, fileType } = req.query;

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
    let matieres = [];
    if(langue === 'fr'){
        matieres = await Matiere.find({ _id: { $in: matiereIds } }).sort({libelleFr:1}).populate('chapitres').populate('objectifs').exec();
    }else{
        matieres = await Matiere.find({ _id: { $in: matiereIds } }).sort({libelleEn:1}).populate('chapitres').populate('objectifs').exec();
    }
    
    if(fileType.toLowerCase()==='pdf'){
        let filePath='./templates/templates_fr/template_progression_matiere_fr.html';
        if(langue==='en'){
            filePath='./templates/templates_en/template_progression_matiere_en.html';
        }
        const htmlContent = await fillTemplate(langue, departement, section, cycle, niveau, matieres, filePath, annee, semestre);

        // Générer le PDF à partir du contenu HTML
        generatePDFAndSendToBrowser(htmlContent, res, 'portrait');
    }else{
         // Créer un nouveau classeur Excel
         const workbook = new ExcelJS.Workbook();
         const worksheet = workbook.addWorksheet('Sheet1');
 
         // Ajouter les en-têtes de colonnes
         if(langue==='fr'){
             worksheet.addRow(['Matieres', 'Progression']);
         }else{
             worksheet.addRow(['Subjects', 'Progression']);
         }
 
         // Ajouter les données des matières
         for (const matiere of matieres) {
             const progress = calculateProgress(matiere, annee, semestre) ; // Remplacez cette logique par votre propre logique pour obtenir la progression
             worksheet.addRow([matiere.libelleFr || matiere.libelleEn, `${progress}%`]);
         }
 
         // Définir le type de contenu pour le téléchargement du fichier
         res.setHeader('Content-Disposition', `attachment; filename=progression_par_objectif_matiere_enseignant_${langue}.xlsx`);
         res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
 
         // Envoyer le fichier Excel en réponse
         await workbook.xlsx.write(res);
    }
}

export const generateProgressChapitreByEnseignant = async (req, res)=>{
    const niveauId = req.params.niveauId;
    const { enseignantId, annee, semestre, langue, departement, section, cycle, niveau, fileType } = req.query;

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
    let matieres = [];
    if(langue === 'fr'){
        matieres = await Matiere.find({ _id: { $in: matiereIds } }).sort({libelleFr:1}).populate('chapitres').populate('chapitres').exec();
    }else{
        matieres = await Matiere.find({ _id: { $in: matiereIds } }).sort({libelleEn:1}).populate('chapitres').populate('chapitres').exec();
    }
    
    if(fileType.toLowerCase()==='pdf'){
    
        let filePath='./templates/templates_fr/template_progression_chapitre_matiere_fr.html';
        if(langue==='en'){
            filePath='./templates/templates_en/template_progression_chapitre_matiere_en.html';
        }
        const htmlContent = await fillTemplateChapitre(langue, departement, section, cycle, niveau, matieres, filePath, annee, semestre);

        // Générer le PDF à partir du contenu HTML
        generatePDFAndSendToBrowser(htmlContent, res, 'portrait');
    }else{
         // Créer un nouveau classeur Excel
         const workbook = new ExcelJS.Workbook();
         const worksheet = workbook.addWorksheet('Sheet1');
 
         // Ajouter les en-têtes de colonnes
         if(langue==='fr'){
             worksheet.addRow(['Matieres', 'Progression']);
         }else{
             worksheet.addRow(['Subjects', 'Progression']);
         }
 
         // Ajouter les données des matières
         for (const matiere of matieres) {
             const progress = calculateProgressChapitre(matiere, annee, semestre) ; // Remplacez cette logique par votre propre logique pour obtenir la progression
             worksheet.addRow([matiere.libelleFr || matiere.libelleEn, `${progress}%`]);
         }
 
         // Définir le type de contenu pour le téléchargement du fichier
         res.setHeader('Content-Disposition', `attachment; filename=progression_par_chapitre_matiere_enseignant_${langue}.xlsx`);
         res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
 
         // Envoyer le fichier Excel en réponse
         await workbook.xlsx.write(res);
    }
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
                    if(chapitre.annee==annee && chapitre.semestre==semestre){
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
                    if(objectif.annee==annee && objectif.semestre==semestre){
                        if (objectifs.length > 0) {
                            objectifs = (objectifs) + ";" +(langue==='fr'?objectif.libelleFr:objectif.libelleEn);
                        } else {
                            objectifs = langue==='fr'?objectif.libelleFr:objectif.libelleEn;
                        }
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

async function fillTemplateChapitre (langue, departement, section, cycle, niveau, matieres, filePath, annee, semestre) {
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
            clonedRow.find('#progression').text(calculateProgressChapitre(matiere, annee, semestre)+" %");
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
    let {limit = 5} = req.query;
    limit = parseInt(limit);
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

        let matieres = [];

        if(limit>5){
            if(langue ==='fr'){
                matieres = await Matiere.find(query)
                    .sort({ libelleFr: 1 }) 
                    .populate('chapitres')
                    .limit(limit); // Limite à 5 résultats
            }else{
                matieres = await Matiere.find(query)
                    .sort({libelleEn: 1 }) 
                    .populate('chapitres')
                    .limit(limit); // Limite à 5 résultats
            }
        }else{
            if(langue ==='fr'){
                matieres = await Matiere.find(query)
                    .select("_id libelleFr libelleEn typesEnseignement")
                    .sort({ libelleFr: 1 }) 
                    .limit(limit); // Limite à 5 résultats
            }else{
                matieres = await Matiere.find(query)
                    .select("_id libelleFr libelleEn typesEnseignement")
                    .sort({libelleEn: 1 }) 
                    .limit(limit); // Limite à 5 résultats
            }
        }

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

export const searchMatiereByEnseignant = async (req, res) => {
    const {searchString, langue} = req.params;
    let { enseignantId, annee, limit } = req.query;
    limit = parseInt(limit);
    try {
        // Récupération des matières avec pagination
        

        const filter = { 
            $or: [
                { enseignantPrincipal: enseignantId },
                { enseignantSuppleant: enseignantId }
            ]
        };

        // Si une année est spécifiée dans la requête, l'utiliser
        if (annee && !isNaN(annee)) {
            filter.annee = parseInt(annee);
        }

        // Rechercher les périodes en fonction du filtre
        const periodes = await Periode.find(filter).select('matiere').exec();

        // Extraire les identifiants uniques des matières
        const matiereIds = [...new Set(periodes.map(periode => periode.matiere))];

        // Récupérer les détails de chaque matière à partir des identifiants uniques
        let matieres = [];
    
        if(langue==='fr'){
            let query = {
                _id: { $in: matiereIds },
                libelleFr: { $regex: `^${searchString}`, $options: 'i' } 
            }
            matieres = await Matiere.find(query).sort({libelleFr:1}).limit(limit).populate('chapitres').populate('objectifs').exec();
        }else{
            let query = {
                _id: { $in: matiereIds },
                libelleEn: { $regex: `^${searchString}`, $options: 'i' } 
            }
            matieres = await Matiere.find(query).sort({libelleEn:1}).limit(limit).populate('chapitres').populate('objectifs').exec();
        }
            

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
        console.error('Erreur lors de la récupération des matières par niveau :', error);
        res.status(500).json({ success: false, message: 'Une erreur est survenue lors de la récupération des matières par niveau.' });
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


