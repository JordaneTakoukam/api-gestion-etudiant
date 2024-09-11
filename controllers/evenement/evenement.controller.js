import Evenement from '../../models/evenement.model.js'
import { message } from '../../configs/message.js';
import { DateTime } from 'luxon';
import mongoose from 'mongoose';
import { formatYear, generatePDFAndSendToBrowser, loadHTML } from '../../fonctions/fonctions.js';
import cheerio from 'cheerio';
import Setting from '../../models/setting.model.js';
import ExcelJS from 'exceljs';


// create
export const createEvenement = async (req, res) => {
    const { code, libelleFr, libelleEn, dateDebut, dateFin, periodeFr, periodeEn, etat, promotion, personnelFr, personnelEn, descriptionObservationFr, descriptionObservationEn, annee } = req.body;

    try {
        // Vérifier si tous les champs obligatoires sont présents
        if (!libelleFr || !libelleEn || !dateDebut || !dateFin || !periodeFr || !periodeEn || !etat || !promotion || !annee) {
            return res.status(400).json({
                success: false,
                message: message.champ_obligatoire
            });
        }

        // Vérifier si les ObjectId pour les références existent
        if (!mongoose.Types.ObjectId.isValid(etat)) {
            return res.status(400).json({ 
                success: false, 
                message: message.identifiant_invalide
            });
        }

        if (!mongoose.Types.ObjectId.isValid(promotion)) {
            return res.status(400).json({ 
                success: false, 
                message: message.identifiant_invalide
            });
        }

        // Vérifier si le code de l'événement existe déjà
        if(code){
            const existingCode = await Evenement.findOne({ code: code });
            if (existingCode) {
                return res.status(400).json({
                    success: false,
                    message: message.existe_code
                });
            }
        }

        // Vérifier si le libelle fr de l'évènement existe déjà
        // const existingLibelleFr = await Evenement.findOne({libelleFr: libelleFr});
        // if (existingLibelleFr) {
        //     return res.status(400).json({
        //         success: false,
        //         message: message.existe_libelle_fr,
        //     });
        // }
        // Vérifier si le libelle en de l'évènement existe déjà
        // const existingLibelleEn = await Evenement.findOne({libelleEn: libelleEn});

        // if (existingLibelleEn) {
        //     return res.status(400).json({
        //         success: false,
        //         message: message.existe_libelle_en,
        //     });
        // }
        
        // Vérifier si le periode fr de l'évènement existe déjà
        // const existingPeriodeFr = await Evenement.findOne({periodeFr: periodeFr});

        // if (existingPeriodeFr) {
        //     return res.status(400).json({
        //         success: false,
        //         message: message.existe_periode_fr,
        //     });
        // }

        // Vérifier si le periode en de l'évènement existe déjà
        // const existingPeriodeEn = await Evenement.findOne({periodeEn: periodeEn});

        // if (existingPeriodeEn) {
        //     return res.status(400).json({
        //         success: false,
        //         message: message.existe_periode_en,
        //     });
        // }

        const isInteger = Number.isInteger(annee);
        if (!isInteger) {
            return res.status(400).json({
                success: false,
                message: message.nombre_entier
            });
            
        }

        const date_creation = DateTime.now().toJSDate();

        // Créer un nouvel événement
        const newEvenement = new Evenement({
            code, libelleFr, libelleEn, dateDebut, dateFin, periodeFr, periodeEn, etat, promotion,
            personnelFr, personnelEn, descriptionObservationFr, descriptionObservationEn, date_creation, annee
        });

        // Vérifier le chevauchement des dates
        // const overlappingEvenements = await Evenement.find({
        //     $or: [
        //         {
        //             $and: [
        //                 { dateDebut: { $lte: newEvenement.dateFin } },
        //                 { dateFin: { $gte: newEvenement.dateDebut } },
        //             ],
        //         },
        //         {
        //             $and: [
        //                 { dateDebut: { $gte: newEvenement.dateDebut } },
        //                 { dateFin: { $lte: newEvenement.dateFin } },
        //             ],
        //         },
        //     ],
        // });

        // if (overlappingEvenements.length > 0) {
        //     return res.status(400).json({
        //         success: false,
        //         message: message.chevauchement
        //     });
        // }

        // Enregistrer le nouvel événement
        const savedEvenement = await newEvenement.save();

        res.json({
            success: true,
            message: message.ajouter_avec_success,
            data: savedEvenement,
        });
    } catch (error) {
        console.error("Erreur interne au serveur :", error);
        res.status(500).json({
            success: false,
            message: message.erreurServeur,
        });
    }
}

//
// update
export const updateEvenement = async (req, res) => {
    const { evenementId } = req.params;
    const { code, libelleFr, libelleEn, dateDebut, dateFin, periodeFr, periodeEn, etat, promotion, personnelFr, personnelEn, descriptionObservationFr, descriptionObservationEn, annee } = req.body;

    try {
        // Vérifier si tous les champs obligatoires sont présents
        if (!libelleFr || !libelleEn || !dateDebut || !dateFin || !periodeFr || !periodeEn || !etat || !promotion || !annee) {
            return res.status(400).json({
                success: false,
                message: message.champ_obligatoire
            });
        }

        // Vérifier si l'ID de l'événement est un ObjectId valide
        if (!mongoose.Types.ObjectId.isValid(evenementId)) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide
            });
        }

        // Vérifier si l'événement existe
        const existingEvenement = await Evenement.findById(evenementId);
        if (!existingEvenement) {
            return res.status(404).json({
                success: false,
                message: message.evenement_inexistant
            });
        }

        // Vérifier si les ObjectId pour les références existent
        if (!mongoose.Types.ObjectId.isValid(etat)) {
            return res.status(400).json({ 
                success: false, 
                message: message.identifiant_invalide
            });
        }

        if (!mongoose.Types.ObjectId.isValid(promotion)) {
            return res.status(400).json({ 
                success: false, 
                message: message.identifiant_invalide
            });
        }

        // Vérifier si le code de l'événement existe déjà (sauf pour l'événement actuel)
        if (code && existingEvenement.code !== code) {
            const existingCode = await Evenement.findOne({ code: code });
            if (existingCode) {
                return res.status(400).json({
                    success: false,
                    message: message.existe_code
                });
            }
        }

        //vérifier si le libelle fr de l'évènement existe déjà
        // if (existingEvenement.libelleFr !== libelleFr) {
        //     const existingCode = await Evenement.findOne({ libelleFr: libelleFr });
        //     if (existingCode) {
        //         return res.status(400).json({
        //             success: false,
        //             message: message.existe_libelle_fr
        //         });
        //     }
        // }

        //vérifier si le libelle en de l'évènement existe déjà
        // if (existingEvenement.libelleEn !== libelleEn) {
        //     const existingCode = await Evenement.findOne({ libelleEn: libelleEn });
        //     if (existingCode) {
        //         return res.status(400).json({
        //             success: false,
        //             message: message.existe_libelle_en
        //         });
        //     }
        // }

        //vérifier si la période fr de l'évènement existe déjà
        // if (existingEvenement.periodeFr !== periodeFr) {
        //     const existingCode = await Evenement.findOne({ periodeFr: periodeFr });
        //     if (existingCode) {
        //         return res.status(400).json({
        //             success: false,
        //             message: message.existe_periode_fr
        //         });
        //     }
        // }

        //vérifier si la période en de l'évènement existe déjà
        // if (existingEvenement.periodeEn !== periodeEn) {
        //     const existingCode = await Evenement.findOne({ periodeEn: periodeEn });
        //     if (existingCode) {
        //         return res.status(400).json({
        //             success: false,
        //             message: message.existe_periode_en
        //         });
        //     }
        // }

        const isInteger = Number.isInteger(annee);
        if (!isInteger) {
            return res.status(400).json({
                success: false,
                message: message.nombre_entier
            });
            
        }

        // Vérifier le chevauchement des dates
        // const overlappingEvenements = await Evenement.find({
        //     _id: { $ne: evenementId }, // Exclure l'événement actuel de la recherche
        //     $or: [
        //         {
        //             $and: [
        //                 { dateDebut: { $lte: dateFin } },
        //                 { dateFin: { $gte: dateDebut } },
        //             ],
        //         },
        //         {
        //             $and: [
        //                 { dateDebut: { $gte: dateDebut } },
        //                 { dateFin: { $lte: dateFin } },
        //             ],
        //         },
        //     ],
        // });

        // if (overlappingEvenements.length > 0) {
        //     return res.status(400).json({
        //         success: false,
        //         message: message.chevauchement
        //     });
        // }

        // Mettre à jour l'événement
        existingEvenement.code = code;
        existingEvenement.libelleFr = libelleFr;
        existingEvenement.libelleEn = libelleEn;
        existingEvenement.dateDebut = dateDebut;
        existingEvenement.dateFin = dateFin;
        existingEvenement.periodeFr = periodeFr;
        existingEvenement.periodeEn = periodeEn;
        existingEvenement.etat = etat;
        existingEvenement.promotion = promotion;
        existingEvenement.personnelFr = personnelFr;
        existingEvenement.personnelEn = personnelEn;
        existingEvenement.descriptionObservationFr = descriptionObservationFr;
        existingEvenement.descriptionObservationEn = descriptionObservationEn;
        existingEvenement.annee = annee;

        // Enregistrer les modifications
        const updatedEvenement = await existingEvenement.save();

        res.json({
            success: true,
            message: message.mis_a_jour,
            data: updatedEvenement,
        });
    } catch (error) {
        console.error("Erreur interne au serveur :", error);
        res.status(500).json({
            success: false,
            message: message.erreurServeur
        });
    }
}

// delete
export const deleteEvenement = async (req, res) => {
    const { evenementId } = req.params;

    try {
        // Vérifier si l'ID de l'événement est un ObjectId valide
        if (!mongoose.Types.ObjectId.isValid(evenementId)) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide
            });
        }

        // // Vérifier si l'événement existe
        // const existingEvenement = await Evenement.findById(evenementId);
        // if (!existingEvenement) {
        //     return res.status(404).json({
        //         success: false,
        //         message: message.evenement_inexistant
        //     });
        // }

        // Supprimer l'événement par son ID
        const deletedEvenement = await Evenement.findByIdAndDelete(evenementId);
        if (!deletedEvenement) {
            return res.status(404).json({
                success: false,
                message: message.evenement_inexistant
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

//Récupérer la liste des évènements d'une année (a besoin de l'année en paramètre de la requête, de la page et du nombre d'élément a récupéré en query params)
export const getEvenementsByYear = async (req, res) => {
    const { annee } = req.params;
    const { promotion, page = 1, pageSize = 10 } = req.query; // Valeurs par défaut pour la pagination

    try {
        // Vérifier si l'année est valide
        if (!annee || isNaN(parseInt(annee))) {
            return res.status(400).json({
                success: false,
                message: message.nombre_entier,
            });
        }

        // Convertir l'année en format numérique
        const numericAnnee = parseInt(annee);

        // Calculer l'indice de début pour la pagination
        const startIndex = (page - 1) * pageSize;

        // Rechercher les événements pour l'année spécifiée avec pagination
        const evenements = await Evenement.find({ annee: numericAnnee, promotion:promotion })
            .sort({ dateDebut: 1 })
            .skip(startIndex)
            .limit(parseInt(pageSize));

        // Compter le nombre total d'événements pour l'année spécifiée
        const totalEvenements = await Evenement.countDocuments({ annee: numericAnnee, promotion:promotion });

        res.json({
            success: true,
            message: message.liste_event,
            data: {
                evenements,
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalEvenements / parseInt(pageSize)),
                totalItems: totalEvenements,
                pageSize : pageSize
            },
        });
    } catch (error) {
        console.error("Erreur interne au serveur :", error);
        res.status(500).json({
            success: false,
            message: message.erreurServeur
        });
    }
}

export const searchEvent = async (req, res) => {
    const {searchString, langue} = req.params; // Récupère la chaîne de recherche depuis les paramètres de requête
    let {limit = 5, annee=2023} = req.query;
    limit = parseInt(limit);
    // console.log(searchString);
    try {
        // Construire la requête pour filtrer les matières
        let query = {
             libelleFr: { $regex: `^${searchString}`, $options: 'i' },
             annee:annee 
        }
        if(langue!=='fr'){
            query = {
                libelleEn: { $regex: `^${searchString}`, $options: 'i' },
                annee:annee 
            }
        }

        const evenements = await Evenement.find(query)
            .sort({ dateDebut: 1 })
            .limit(limit);

        res.json({
            success: true,
            data: {
                evenements,
                currentPage: 0,
                totalPages: 1,
                totalItems: evenements.length,
                pageSize: 10,
            }
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des matières :', error);
        res.status(500).json({ success: false, message: 'Une erreur est survenue sur le serveur.' });
    }
};

//Récupérer la liste des évènements d'une année (a besoin de l'année en paramètre de la requête, de la page et du nombre d'élément a récupéré en query params)
export const getAllEvenementsByYear = async (req, res) => {
    const { annee } = req.params;

    try {
        // Vérifier si l'année est valide
        if (!annee || isNaN(parseInt(annee))) {
            return res.status(400).json({
                success: false,
                message: message.nombre_entier,
            });
        }

        // Convertir l'année en format numérique
        const numericAnnee = parseInt(annee);

        // Rechercher les événements pour l'année spécifiée avec pagination
        const evenements = await Evenement.find({ annee: numericAnnee });

        res.json({
            success: true,
            message: message.liste_event,
            data: {
                evenements,
                currentPage: 0,
                totalPages: 0,
                totalItems: 0,
                pageSize : 0
            },
        });
    } catch (error) {
        console.error("Erreur interne au serveur :", error);
        res.status(500).json({
            success: false,
            message: message.erreurServeur
        });
    }
}

//Récupérer la liste des évènement à venir (a besoin de l'année en paramètre de la requête et du nombre d'évènement en query params)
export const getUpcommingEventsOfYear = async (req, res) => {
    try {
        const annee = req.params; // Année spécifiée dans la requête
        const { nbEvenement=5 } = req.query;
        const currentDate = new Date(); // Date du jour
        // Assurez-vous que currentDate est bien une date valide
        if (isNaN(currentDate.getTime())) {
            return res.status(500).json({
                success: false,
                message: 'Erreur interne au serveur : Date du jour invalide',
            });
        }


        // Récupérer les 10 premiers événements
        const evenements = await Evenement.find({
            dateDebut: { $gte: currentDate } // Événements commençant à partir de la date du jour et jusqu'à la fin de l'année spécifiée
        })
        .sort({ dateDebut: 1 }) // Trier les événements par date de début croissante
        .limit(nbEvenement); // Limiter les résultats à 10 événements

        res.json({
            success: true,
            message: message.event_a_venir,
            data: {evenements},
        });
    } catch (error) {
        console.error("Erreur interne au serveur :", error);
        res.status(500).json({
            success: false,
            message: message.erreurServeur,
        });
    }
}

export const generateListEvent = async (req, res)=>{
    const { annee = 2023 } = req.params;
    const {langue, fileType}=req.query;
    const evenements = await Evenement.find({ annee: annee }).sort({ dateDebut: 1 });
    let filePath='./templates/templates_fr/template_calendrier_fr.html';
    if(langue==='en'){
        filePath='./templates/templates_en/template_calendrier_en.html';
    }
    if(fileType.toLowerCase() === 'pdf'){
        const htmlContent = await fillTemplate(langue, evenements, filePath, annee);

        // Générer le PDF à partir du contenu HTML
        generatePDFAndSendToBrowser(htmlContent, res, 'portrait');
    }else{
        exportToExcel(evenements, langue, res)
    }
}

async function exportToExcel (evenements, langue, res) {

    try {
        // Filtrer les entêtes se terminant par "Fr" et ceux qui ne se terminent ni par "Fr" ni par "En"
        let headers = Object.keys(evenements[0]).filter(
            header => !['_id', '__v', 'date_creation', 'code'].includes(header) &&
                (header.endsWith("Fr") || (!header.endsWith("Fr") && !header.endsWith("En")))
        );
        if (langue !== 'fr') {
            headers = Object.keys(evenements[0]).filter(
                header => !['_id', '__v', 'date_creation', 'code'].includes(header) &&
                    (header.endsWith("En") || (!header.endsWith("En") && !header.endsWith("Fr")))
            );
        }

        // Filtrer les données pour ne récupérer que les propriétés correspondantes aux entêtes sélectionnés
        const filteredDataForExport = evenements.map(item => {
            const filteredItem = {};

            headers.forEach(header => {
                if (item && Object.prototype.hasOwnProperty.call(item, header)) {
                    if (header === 'etat') {
                        // const etat = etats.find(etat => etat._id === item[header]);
                        // filteredItem[header] = etat ? (langue === 'fr' ? etat.libelleFr : etat.libelleEn) : item[header];
                    } else if (header === 'promotion') {
                        // const promotion = promotions.find(promotion => promotion._id === item[header]);
                        // filteredItem[header] = promotion ? (langue === 'fr' ? promotion.libelleFr : promotion.libelleEn) : item[header];
                    } else if (header === 'dateDebut' || header === 'dateFin') {
                        const datePart = item[header].split('T')[0];
                        filteredItem[header] = datePart;
                    } else {
                        filteredItem[header] = item[header]?.toString();
                    }
                }
            });

            return filteredItem;
        });

        // Renommer les entêtes du tableau d'objets
        const renamedDataForExport = filteredDataForExport.map(item => {
            const renamedItem = {};

            Object.keys(item).forEach(key => {
                switch (key) {
                    case 'libelleFr':
                    case 'libelleEn':
                        renamedItem[langue === 'fr' ? 'Libellé' : 'Label'] = item[key];
                        break;
                    case 'dateDebut':
                        renamedItem[langue === 'fr' ? 'Date de début' : 'Start date'] = item[key];
                        break;
                    case 'dateFin':
                        renamedItem[langue === 'fr' ? 'Date de fin' : 'End date'] = item[key];
                        break;
                    case 'periodeFr':
                    case 'periodeEn':
                        renamedItem[langue === 'fr' ? 'Période' : 'Period'] = item[key];
                        break;
                    case 'personnelFr':
                    case 'personnelEn':
                        renamedItem[langue === 'fr' ? 'Personnel' : 'Personnel'] = item[key];
                        break;
                    case 'descriptionObservationFr':
                    case 'descriptionObservationEn':
                        renamedItem['Description/Observation'] = item[key];
                        break;
                    case 'etat':
                        renamedItem[langue === 'fr' ? 'État' : 'Status'] = item[key];
                        break;
                    case 'promotion':
                        renamedItem['Promotion'] = item[key];
                        break;
                    case 'annee':
                        renamedItem[langue === 'fr' ? 'Année' : 'Year'] = item[key];
                        break;
                    default:
                        renamedItem[key] = item[key];
                        break;
                }
            });

            return renamedItem;
        });

        // Créer un nouveau classeur Excel
        const workbook = new ExcelJS.Workbook();
        // Ajouter une nouvelle feuille de calcul
        const worksheet = workbook.addWorksheet('Sheet1');

        // Ajouter les entêtes
        worksheet.columns = Object.keys(renamedDataForExport[0]).map(key => ({ header: key, key }));

        // Ajouter les données
        // renamedDataForExport.forEach(item => {
        //     worksheet.addRow(item);
        // });

        // Définir les en-têtes de réponse pour le téléchargement du fichier
        res.setHeader('Content-Disposition', `attachment;`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        // Envoyer le fichier Excel en réponse
        await workbook.xlsx.write(res);
    } catch (error) {
        console.error('Erreur lors de la génération du fichier Excel:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la génération du fichier Excel' });
    }
};

async function fillTemplate (langue, evenements, filePath, annee) {
    try {
        const htmlString = await loadHTML(filePath);
        const $ = cheerio.load(htmlString); // Charger le template HTML avec cheerio
        const body = $('body');
        body.find('#annee').text(formatYear(parseInt(annee)));
        const userTable = $('#table-calendrier');
        const rowTemplate = $('.row_template');
        let settings = await Setting.find().select('etatsEvenement');
        let setting = null;
        if(settings.length>0){
            setting=settings[0]
        }
        
        for (const event of evenements) {
            const clonedRow = rowTemplate.clone();
            
            clonedRow.find('#libelle').text(langue==='fr'?event.libelleFr:event.libelleEn);
            clonedRow.find('#periode').text(langue==='fr'?event.periodeFr:event.periodeEn);
            clonedRow.find('#personnel').text(langue==='fr'?event.personnelFr:event.personnelEn);
            clonedRow.find('#description_observation').text(langue==='fr'?event.descriptionObservationFr:event.descriptionObservationEn);
            clonedRow.find('#fonction').text("");
            if(event.etat!=null && setting){
                const etat= setting.etatsEvenement.find((etat)=>etat._id.toString()===event.etat.toString());
                clonedRow.find('#statut').text(langue==='fr'?etat?.libelleFr??"":etat?.libelleEn??"");
            }
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
export const readEvenement = async (req, res) => { }


export const readEvenements = async (req, res) => { }





