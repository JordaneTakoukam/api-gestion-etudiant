import PeriodeEnseignement from '../../models/periode_enseignement.model.js'
import Matiere from '../../models/matiere.model.js';
import { message } from '../../configs/message.js';
import mongoose from 'mongoose';
import { DateTime } from 'luxon';
const { ObjectId } = mongoose.Types;
import moment from 'moment';
import { formatDate } from '../../fonctions/fonctions.js';
import { calculateProgress, formatYear, generatePDFAndSendToBrowser, loadHTML } from '../../fonctions/fonctions.js';
import cheerio from 'cheerio';
// create

export const createPeriodeEnseignement = async (req, res) => {
    const { annee, semestre, niveau, periodeFr, periodeEn, dateDebut, dateFin, enseignements } = req.body;

    try {

        // Vérifier que tous les champs obligatoires sont présents
        if (!annee || !semestre || !periodeFr || !periodeEn || !dateDebut || !dateFin || !niveau) {
            return res.status(400).json({ 
                success: false, 
                message: message.champ_obligatoire 
            });
        }

        if (!mongoose.Types.ObjectId.isValid(niveau)) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide
            });
        }

        for (const enseignement of enseignements) {
            
                // if (!mongoose.Types.ObjectId.isValid(enseignement.typeEnseignement)) {
                //     return res.status(400).json({ 
                //         success: false, 
                //         message: message.identifiant_invalide,
                //     });
                // }
                if (!mongoose.Types.ObjectId.isValid(enseignement.matiere)) {
                    return res.status(400).json({ 
                        success: false, 
                        message: message.identifiant_invalide,
                });
                
            }
            
        }
        // Vérifier si le periode fr de la période d'enseignement existe déjà
        const existingPeriodeFr = await PeriodeEnseignement.findOne({periodeFr: periodeFr, niveau:niveau});

        if (existingPeriodeFr) {
            return res.status(400).json({
                success: false,
                message: message.existe_periode_fr,
            });
        }

        // Vérifier si le periode en de la période d'enseignement existe déjà
        const existingPeriodeEn = await PeriodeEnseignement.findOne({periodeEn: periodeEn, niveau:niveau});

        if (existingPeriodeEn) {
            return res.status(400).json({
                success: false,
                message: message.existe_periode_en,
            });
        }

        const isInteger = Number.isInteger(annee);
        if (!isInteger) {
            return res.status(400).json({
                success: false,
                message: message.nombre_entier
            });
            
        }

       

        const date_creation = DateTime.now().toJSDate();

        // Créer une nouvelle période d'enseignement avec les données reçues
        const nouvellePeriode = new PeriodeEnseignement({
            annee,
            semestre,
            periodeFr,
            periodeEn,
            dateDebut,
            dateFin,
            niveau,
            enseignements,
            date_creation
        });

         // Vérifier le chevauchement des dates
         const overlappingPeriodeEnseignement = await PeriodeEnseignement.find({
            niveau:niveau,
            $or: [
                // Nouvelle période commence avant la période existante et se termine après
                {
                    dateDebut: { $lte: nouvellePeriode.dateFin },
                    dateFin: { $gte: nouvellePeriode.dateDebut }
                },
                // Nouvelle période commence après la période existante et se termine avant
                {
                    dateDebut: { $gte: nouvellePeriode.dateDebut },
                    dateFin: { $lte: nouvellePeriode.dateFin }
                }
            ]
        });

        if (overlappingPeriodeEnseignement.length > 0) {
            return res.status(400).json({
                success: false,
                message: message.chevauchement
            });
        }

        // Enregistrer la nouvelle période d'enseignement dans la base de données
        const savePeriode = await nouvellePeriode.save();

        res.status(200).json({ 
            success: true, 
            message: message.ajouter_avec_success,
            data: savePeriode
        });
    } catch (error) {
        console.error('Erreur lors de l\'enregistrement de la période d\'enseignement :', error);
        res.status(500).json({ 
            success: false, 
            message: message.erreurServeur
        });
    }
}
// update
export const updatePeriodeEnseignement = async (req, res) => {
    const { periodeEnseignementId } = req.params; // Récupérer l'ID de la période d'enseignement depuis les paramètres de la requête
    const { annee, semestre, periodeFr, periodeEn, dateDebut, dateFin, niveau, enseignements } = req.body;

    try {
        // Vérifier si l'ID de la période d'enseignement est un ObjectId valide
        if (!mongoose.Types.ObjectId.isValid(periodeEnseignementId)) {
            // console.log("periode "+periodeEnseignementId);
            return res.status(400).json({ 
                success: false, 
                message: message.identifiant_invalide,
            });
        }

        // Vérifier si la période d'enseignement à mettre à jour existe dans la base de données
        const existingPeriode = await PeriodeEnseignement.findById(periodeEnseignementId);
        if (!existingPeriode) {
            
            return res.status(404).json({ 
                success: false, 
                message: message.periode_non_trouve,
            });
        }

        if (!mongoose.Types.ObjectId.isValid(niveau)) {
            // console.log("niveau");
            return res.status(400).json({ 
                success: false, 
                message: message.identifiant_invalide,
            });
        }

        for (const enseignement of enseignements) {
            // if (!mongoose.Types.ObjectId.isValid(enseignement.typeEnseignement)) {
            //     // console.log("type_ens");
            //     return res.status(400).json({ 
            //         success: false, 
            //         message: message.identifiant_invalide,
            //     });
            // }
            if (!mongoose.Types.ObjectId.isValid(enseignement.matiere._id)) {
                
                return res.status(400).json({ 
                    success: false, 
                    message: message.identifiant_invalide,
                });
            }
        }

         //vérifier si la période fr de la période d'enseignement existe déjà
         if (existingPeriode.periodeFr !== periodeFr) {
            const existingPeriodeFr = await PeriodeEnseignement.findOne({ periodeFr: periodeFr, niveau:niveau });
            if (existingPeriodeFr) {
                return res.status(400).json({
                    success: false,
                    message: message.existe_periode_fr
                });
            }
        }

        //vérifier si la période en de la période d'enseignement existe déjà
        if (existingPeriode.periodeEn !== periodeEn) {
            const existingPeriodeEn = await PeriodeEnseignement.findOne({ periodeEn: periodeEn, niveau:niveau });
            if (existingPeriodeEn) {
                return res.status(400).json({
                    success: false,
                    message: message.existe_periode_en
                });
            }
        }

        const isIntegerAnnee = Number.isInteger(annee);
        if (!isIntegerAnnee) {
            return res.status(400).json({
                success: false,
                message: message.nombre_entier
            });
            
        }

        const isIntegerSemestre = Number.isInteger(semestre);
        if (!isIntegerSemestre) {
            return res.status(400).json({
                success: false,
                message: message.nombre_entier
            });
            
        }

        // Vérifier le chevauchement des dates
        const overlappingPeriodeEnseignement = await PeriodeEnseignement.find({
            niveau:niveau,
            _id: { $ne: periodeEnseignementId }, // Exclure l'événement actuel de la recherche
            $or: [
                {
                    $and: [
                        { dateDebut: { $lte: dateFin } },
                        { dateFin: { $gte: dateDebut } },
                    ],
                },
                {
                    $and: [
                        { dateDebut: { $gte: dateDebut } },
                        { dateFin: { $lte: dateFin } },
                    ],
                },
            ],
        });

        if (overlappingPeriodeEnseignement.length > 0) {
            return res.status(400).json({
                success: false,
                message: message.chevauchement
            });
        }

        // Mettre à jour les champs de la période d'enseignement avec les nouvelles valeurs
        existingPeriode.annee = annee;
        existingPeriode.semestre = semestre;
        existingPeriode.periodeFr = periodeFr;
        existingPeriode.periodeEn = periodeEn;
        existingPeriode.dateDebut = dateDebut;
        existingPeriode.dateFin = dateFin;
        existingPeriode.niveau = niveau;
        existingPeriode.enseignements = enseignements;

        // Enregistrer les modifications dans la base de données
        const updatedPeriode = await existingPeriode.save();
        // Recherche des enseignements mis à jour avec les nouveaux IDs
        const updatedEnseignements = await PeriodeEnseignement.findById(updatedPeriode._id).populate('enseignements.matiere', '_id code libelleFr libelleEn');

        res.status(200).json({ 
            success: true, 
            message: message.mis_a_jour,
            data: updatedEnseignements
        });
    } catch (error) {
        console.error('Erreur lors de la mise à jour de la période d\'enseignement :', error);
        res.status(500).json({ 
            success: false, 
            message: message.erreurServeur
        });
    }
}

// delete
export const deletePeriodeEnseignement = async (req, res) => {
    const { periodeEnseignementId } = req.params;

    try {
        // Vérifier si l'ID de l'événement est un ObjectId valide
        if (!mongoose.Types.ObjectId.isValid(periodeEnseignementId)) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide
            });
        }

        
        const deletedPeriodeEnseignement = await PeriodeEnseignement.findByIdAndDelete(periodeEnseignementId);
        if (!deletedPeriodeEnseignement) {
            return res.status(404).json({
                success: false,
                message: message.periode_non_trouve
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

export const getPeriodesEnseignementWithPagination = async (req, res) => {
    const {niveauId} = req.params;
    const { annee, semestre, page = 1, pageSize = 10 } = req.query;

    try {
        // Vérifier si l'ID du niveau est un ObjectId valide
        if (!mongoose.Types.ObjectId.isValid(niveauId)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Identifiant du niveau invalide.'
            });
        }

        // Conversion de la page et de la limite en nombres entiers
        const pageNumber = parseInt(page);
        const limitNumber = parseInt(pageSize);

        // Calculer l'index de départ
        const startIndex = (pageNumber - 1) * limitNumber;

        // Rechercher les périodes d'enseignement avec pagination
        const periodes = await PeriodeEnseignement.find({ 
            niveau: niveauId,
            annee: annee,
            semestre: semestre,
        })
        .populate({
            path: 'enseignements.matiere',
            select: '_id code libelleFr libelleEn typesEnseignement'
        })
        .skip(startIndex)
        .limit(limitNumber);

        // Compter le nombre total de périodes d'enseignement
        const totalPeriodes = await PeriodeEnseignement.countDocuments({ 
            niveau: niveauId,
            annee: annee,
            semestre: semestre
        });
        res.status(200).json({ 
            success: true, 
            data:{
                periodes,
                totalPages: Math.ceil(totalPeriodes / limitNumber),
                currentPage: pageNumber,
                totalItems: totalPeriodes,
                pageSize:parseInt(pageSize)
            } 
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des périodes d\'enseignement :', error);
        res.status(500).json({ 
            success: false, 
            message: message.erreurServeur
        });
    }
}


// export const getPeriodesEnseignement = async (req, res) => {
//     const { niveauId } = req.params;
//     const { annee, semestre } = req.query;

//     try {
//         if (!mongoose.Types.ObjectId.isValid(niveauId)) {
//             return res.status(400).json({ 
//                 success: false, 
//                 message: 'Identifiant du niveau invalide.'
//             });
//         }

//         const periodes = await PeriodeEnseignement.find({ 
//             niveau: niveauId,
//             annee: annee,
//             semestre: semestre,
//         });

//         periodes.forEach(periode => {
//             periode.dateDebut = moment(periode.dateDebut).toDate();
//             periode.dateFin = moment(periode.dateFin).toDate();
//         });

//         await Promise.all(periodes.map(async (periode) => {
//             await Promise.all(periode.enseignements.map(async (enseignement) => {
//                 const enseignementPopulated = await Matiere.populate(enseignement, {
//                     path: 'matiere',
//                     select: '_id code libelleFr libelleEn typesEnseignement', 
//                     populate: {
//                         path: 'typesEnseignement.enseignantPrincipal',
//                         select: '_id nom prenom email',
//                         populate: {
//                             path: 'absences',
//                             select: '_id dateAbsence heureDebut heureFin',
//                             match: { 
//                                 dateAbsence: { 
//                                     $gte: periode.dateDebut,
//                                     $lte: periode.dateFin
//                                 }
//                             }
//                         }
//                     }
//                 });
//                 enseignement.matiere = enseignementPopulated.matiere;
//             }));
//         }));

//         res.status(200).json({ 
//             success: true, 
//             data: {
//                 periodes,
//                 totalPages: 0,
//                 currentPage: 0,
//                 totalItems: 0,
//                 pageSize: 0
//             } 
//         });
//     } catch (error) {
//         console.error('Erreur lors de la récupération des périodes d\'enseignement :', error);
//         res.status(500).json({ 
//             success: false, 
//             message: 'Erreur interne du serveur.'
//         });
//     }
// }

export const getPeriodesEnseignement = async (req, res) => {
    const { niveauId } = req.params;
    const { annee, semestre } = req.query;

    try {
        if (!mongoose.Types.ObjectId.isValid(niveauId)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Identifiant du niveau invalide.'
            });
        }

        const periodes = await PeriodeEnseignement.find({ 
            niveau: niveauId,
            annee: annee,
            semestre: semestre,
        });

        periodes.forEach(periode => {
            periode.dateDebut = moment(new Date(periode.dateDebut)).toDate();
            periode.dateFin = moment(new Date(periode.dateFin)).toDate();
        });

        await Promise.all(periodes.map(async (periode) => {
            await Promise.all(periode.enseignements.map(async (enseignement) => {
                const enseignementPopulated = await Matiere.populate(enseignement, {
                    path: 'matiere',
                    select: '_id code libelleFr libelleEn', 
                    populate: {
                        path: 'objectifs', 
                    }
                });
                enseignement.matiere = enseignementPopulated.matiere;
                // Calculer le nombre de séances pratiquées pour chaque matière
                enseignement.nbSeancesPratiquees = enseignement.matiere.objectifs.reduce((acc, obj) => {
                    
                    if (obj.annee==annee && obj.semestre==semestre && obj.date_etat && obj.etat==1 && formatDate(obj.date_etat) >= formatDate(periode.dateDebut) && formatDate(obj.date_etat) <= formatDate(periode.dateFin)) {
                        
                        acc.add(moment(obj.date_etat).format('YYYY-MM-DD'));
                    }
                    return acc;
                }, new Set()).size;
            }));
        }));

        res.status(200).json({ 
            success: true, 
            data: {
                periodes,
                totalPages: 0,
                currentPage: 0,
                totalItems: 0,
                pageSize: 0
            } 
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des périodes d\'enseignement :', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur interne du serveur.'
        });
    }
}

// export const getMatierePeriodesEnseignement = async (req, res) => {
//     const { periodeId } = req.params;
//     const { page, pageSize, annee, semestre } = req.query;

//     try {
//         if (!mongoose.Types.ObjectId.isValid(niveauId)) {
//             return res.status(400).json({ 
//                 success: false, 
//                 message: 'Identifiant du niveau invalide.'
//             });
//         }

//         const periodes = await PeriodeEnseignement.find({ 
//             niveau: niveauId,
//             annee: annee,
//             semestre: semestre,
//         });

//         periodes.forEach(periode => {
//             periode.dateDebut = moment(new Date(periode.dateDebut)).toDate();
//             periode.dateFin = moment(new Date(periode.dateFin)).toDate();
//         });

//         await Promise.all(periodes.map(async (periode) => {
//             await Promise.all(periode.enseignements.map(async (enseignement) => {
//                 const enseignementPopulated = await Matiere.populate(enseignement, {
//                     path: 'matiere',
//                     select: '_id code libelleFr libelleEn', 
//                     populate: {
//                         path: 'objectifs', 
//                     }
//                 });
//                 enseignement.matiere = enseignementPopulated.matiere;
//                 // Calculer le nombre de séances pratiquées pour chaque matière
//                 enseignement.nbSeancesPratiquees = enseignement.matiere.objectifs.reduce((acc, obj) => {
                    
//                     if (obj.annee==annee && obj.semestre==semestre && obj.date_etat && obj.etat==1 && formatDate(obj.date_etat) >= formatDate(periode.dateDebut) && formatDate(obj.date_etat) <= formatDate(periode.dateFin)) {
                        
//                         acc.add(moment(obj.date_etat).format('YYYY-MM-DD'));
//                     }
//                     return acc;
//                 }, new Set()).size;
//             }));
//         }));

//         res.status(200).json({ 
//             success: true, 
//             data: {
//                 periodes,
//                 totalPages: 0,
//                 currentPage: 0,
//                 totalItems: 0,
//                 pageSize: 0
//             } 
//         });
//     } catch (error) {
//         console.error('Erreur lors de la récupération des périodes d\'enseignement :', error);
//         res.status(500).json({ 
//             success: false, 
//             message: 'Erreur interne du serveur.'
//         });
//     }
// }

export const generateListPeriodeEnseignement = async (req, res)=>{
    const { annee, semestre } = req.params;
    const {  departement, section, cycle, niveau, langue } = req.query;

    if (!mongoose.Types.ObjectId.isValid(niveau._id)) {
        return res.status(400).json({ 
            success: false, 
            message: message.identifiant_invalide
        });
    }

    const periodes = await PeriodeEnseignement.find({ 
        niveau: niveau._id,
        annee: annee,
        semestre: semestre,
    });

    periodes.forEach(periode => {
        periode.dateDebut = moment(new Date(periode.dateDebut)).toDate();
        periode.dateFin = moment(new Date(periode.dateFin)).toDate();
    });

    await Promise.all(periodes.map(async (periode) => {
        await Promise.all(periode.enseignements.map(async (enseignement) => {
            const enseignementPopulated = await Matiere.populate(enseignement, {
                path: 'matiere',
                select: '_id code libelleFr libelleEn', 
                populate: {
                    path: 'objectifs', 
                }
            });
            enseignement.matiere = enseignementPopulated.matiere;
            // Calculer le nombre de séances pratiquées pour chaque matière
            enseignement.nbSeancesPratiquees = enseignement.matiere.objectifs.reduce((acc, obj) => {
                
                if (obj.date_etat && obj.etat==1 && formatDate(obj.date_etat) >= formatDate(periode.dateDebut) && formatDate(obj.date_etat) <= formatDate(periode.dateFin)) {
                    
                    acc.add(moment(obj.date_etat).format('YYYY-MM-DD'));
                }
                return acc;
            }, new Set()).size;
        }));
    }));
    let filePath='./templates/templates_fr/template_periode_enseignement_fr.html';
    if(langue==='en'){
        filePath='./templates/templates_en/template_periode_enseignement_en.html';
    }

    const htmlContent = await fillTemplate(departement, section, cycle, niveau, langue, periodes, filePath, annee, semestre);

    // Générer le PDF à partir du contenu HTML
    generatePDFAndSendToBrowser(htmlContent, res, 'portrait');
}

async function fillTemplate (departement, section, cycle, niveau, langue, periodes, filePath, annee, semestre) {
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
        const userTable = $('#table-periode-enseignement');
        const rowTemplate = $('.row_template');
        const periodTemplate=$('.periode_template')
        
        for (const periode of periodes) {
            const clonedRowPeriod = periodTemplate.clone();
            clonedRowPeriod.find('#title-periode').text(langue==='fr'?periode.periodeFr:periode.periodeEn);
            userTable.append(clonedRowPeriod);
            if(periode.enseignements){
                for(const enseignement of periode.enseignements){   
                    const clonedRow = rowTemplate.clone();
                    clonedRow.find('#matiere').text(langue==='fr'?enseignement.matiere.libelleFr:enseignement.matiere.libelleEn);
                    clonedRow.find('#periode-enseignement').text(enseignement.nombreSeance);
                    userTable.append(clonedRow);
                }
            }
        }
        periodTemplate.first().remove();
        rowTemplate.first().remove();

        return $.html(); // Récupérer le HTML mis à jour
    } catch (error) {
        console.error('Erreur lors du remplissage du template :', error);
        return '';
    }
};


export const generateProgressionPeriodeEnseignement = async (req, res)=>{
    const {periodeId}=req.params;
    const {departement, section, cycle, niveau, langue, annee, semestre}=req.query;
    try{
        if (!mongoose.Types.ObjectId.isValid(periodeId)) {
            return res.status(400).json({ 
                success: false, 
                message: message.identifiant_invalide
            });
        }
        const periode = await PeriodeEnseignement.findOne({ 
            _id: periodeId,
        });

        periode.dateDebut = moment(new Date(periode.dateDebut)).toDate();
        periode.dateFin = moment(new Date(periode.dateFin)).toDate();

        
        await Promise.all(periode.enseignements.map(async (enseignement) => {
            const enseignementPopulated = await Matiere.populate(enseignement, {
                path: 'matiere',
                select: '_id code libelleFr libelleEn', 
                populate: {
                    path: 'objectifs', 
                }
            });
            enseignement.matiere = enseignementPopulated.matiere;
            // Calculer le nombre de séances pratiquées pour chaque matière
            enseignement.nbSeancesPratiquees = enseignement.matiere.objectifs.reduce((acc, obj) => {
                
                if (obj.annee==annee && obj.semestre==semestre && obj.date_etat && obj.etat==1 && formatDate(obj.date_etat) >= formatDate(periode.dateDebut) && formatDate(obj.date_etat) <= formatDate(periode.dateFin)) {
                    
                    acc.add(moment(obj.date_etat).format('YYYY-MM-DD'));
                }
                return acc;
            }, new Set()).size;
        }));

        let filePath='./templates/templates_fr/template_progression_periode_enseignement_fr.html'
        if(langue==='en'){
            filePath='./templates/templates_en/template_progression_periode_enseignement_en.html';
        }
        const htmlContent = await fillTemplateProg(departement, section, cycle, niveau, langue, periode, filePath, annee, semestre);

        // Générer le PDF à partir du contenu HTML
        generatePDFAndSendToBrowser(htmlContent, res, 'portrait');
    }catch(e){

    }
}

async function fillTemplateProg (departement, section, cycle, niveau, langue, periode, filePath, annee, semestre) {
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
        body.find('#title-periode').text(langue==='fr'?periode.periodeFr:periode.periodeEn);
        const userTable = $('#table-periode-enseignement');
        
        const matTemplate = $('.matiere_template');
        const elemTemplate = $('.elem_template'); 
        const rowTemplate = $('.row_template');

        
        if(periode.enseignements){
            for(const enseignement of periode.enseignements){   
                const clonedMat = matTemplate.clone();
                
                clonedMat.find('#title-matiere').text(langue==='fr'?enseignement.matiere.libelleFr:enseignement.matiere.libelleEn);
                userTable.append(clonedMat);
                const clonedElm = elemTemplate.clone();
                userTable.append(clonedElm);
                const clonedRow = rowTemplate.clone();
                clonedRow.find('#nb-seance').text(enseignement.nombreSeance);
                clonedRow.find('#nb-seance-pra').text(enseignement.nbSeancesPratiquees);
                const gap=enseignement.nombreSeance-enseignement.nbSeancesPratiquees;
                clonedRow.find('#gap').text(gap);
                const taux = ((enseignement.nbSeancesPratiquees/ enseignement.nombreSeance) * 100).toFixed(2)
                clonedRow.find('#taux').text(taux+" %");
                userTable.append(clonedRow);
            }
        }
        
        matTemplate.first().remove();
        elemTemplate.first().remove();
        rowTemplate.first().remove();

        return $.html(); // Récupérer le HTML mis à jour
    } catch (error) {
        console.error('Erreur lors du remplissage du template :', error);
        return '';
    }
};




