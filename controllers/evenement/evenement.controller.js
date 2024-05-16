import Evenement from '../../models/evenement.model.js'
import { message } from '../../configs/message.js';
import { DateTime } from 'luxon';
import mongoose from 'mongoose';
import { formatYear, generatePDFAndSendToBrowser, loadHTML } from '../../fonctions/fonctions.js';
import cheerio from 'cheerio';
import Setting from '../../models/setting.model.js';


// create
export const createEvenement = async (req, res) => {
    const { code, libelleFr, libelleEn, dateDebut, dateFin, periodeFr, periodeEn, etat, personnelFr, personnelEn, descriptionObservationFr, descriptionObservationEn, annee } = req.body;

    try {
        // Vérifier si tous les champs obligatoires sont présents
        if (!code || !libelleFr || !libelleEn || !dateDebut || !dateFin || !periodeFr || !periodeEn || !etat || !annee) {
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

        // Vérifier si le code de l'événement existe déjà
        const existingCode = await Evenement.findOne({ code: code });
        if (existingCode) {
            return res.status(400).json({
                success: false,
                message: message.existe_code
            });
        }

        // Vérifier si le libelle fr de l'évènement existe déjà
        const existingLibelleFr = await Evenement.findOne({libelleFr: libelleFr});
        if (existingLibelleFr) {
            return res.status(400).json({
                success: false,
                message: message.existe_libelle_fr,
            });
        }
        // Vérifier si le libelle en de l'évènement existe déjà
        const existingLibelleEn = await Evenement.findOne({libelleEn: libelleEn});

        if (existingLibelleEn) {
            return res.status(400).json({
                success: false,
                message: message.existe_libelle_en,
            });
        }
        
        // Vérifier si le periode fr de l'évènement existe déjà
        const existingPeriodeFr = await Evenement.findOne({periodeFr: periodeFr});

        if (existingPeriodeFr) {
            return res.status(400).json({
                success: false,
                message: message.existe_periode_fr,
            });
        }

        // Vérifier si le periode en de l'évènement existe déjà
        const existingPeriodeEn = await Evenement.findOne({periodeEn: periodeEn});

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

        // Créer un nouvel événement
        const newEvenement = new Evenement({
            code, libelleFr, libelleEn, dateDebut, dateFin, periodeFr, periodeEn, etat,
            personnelFr, personnelEn, descriptionObservationFr, descriptionObservationEn, date_creation, annee
        });

        // Vérifier le chevauchement des dates
        const overlappingEvenements = await Evenement.find({
            $or: [
                {
                    $and: [
                        { dateDebut: { $lte: newEvenement.dateFin } },
                        { dateFin: { $gte: newEvenement.dateDebut } },
                    ],
                },
                {
                    $and: [
                        { dateDebut: { $gte: newEvenement.dateDebut } },
                        { dateFin: { $lte: newEvenement.dateFin } },
                    ],
                },
            ],
        });

        if (overlappingEvenements.length > 0) {
            return res.status(400).json({
                success: false,
                message: message.chevauchement
            });
        }

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
    const { code, libelleFr, libelleEn, dateDebut, dateFin, periodeFr, periodeEn, etat, personnelFr, personnelEn, descriptionObservationFr, descriptionObservationEn, annee } = req.body;

    try {
        // Vérifier si tous les champs obligatoires sont présents
        if (!code || !libelleFr || !libelleEn || !dateDebut || !dateFin || !periodeFr || !periodeEn || !etat || !annee) {
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

        // Vérifier si le code de l'événement existe déjà (sauf pour l'événement actuel)
        if (existingEvenement.code !== code) {
            const existingCode = await Evenement.findOne({ code: code });
            if (existingCode) {
                return res.status(400).json({
                    success: false,
                    message: message.existe_code
                });
            }
        }

        //vérifier si le libelle fr de l'évènement existe déjà
        if (existingEvenement.libelleFr !== libelleFr) {
            const existingCode = await Evenement.findOne({ libelleFr: libelleFr });
            if (existingCode) {
                return res.status(400).json({
                    success: false,
                    message: message.existe_libelle_fr
                });
            }
        }

        //vérifier si le libelle en de l'évènement existe déjà
        if (existingEvenement.libelleEn !== libelleEn) {
            const existingCode = await Evenement.findOne({ libelleEn: libelleEn });
            if (existingCode) {
                return res.status(400).json({
                    success: false,
                    message: message.existe_libelle_en
                });
            }
        }

        //vérifier si la période fr de l'évènement existe déjà
        if (existingEvenement.periodeFr !== periodeFr) {
            const existingCode = await Evenement.findOne({ periodeFr: periodeFr });
            if (existingCode) {
                return res.status(400).json({
                    success: false,
                    message: message.existe_periode_fr
                });
            }
        }

        //vérifier si la période en de l'évènement existe déjà
        if (existingEvenement.periodeEn !== periodeEn) {
            const existingCode = await Evenement.findOne({ periodeEn: periodeEn });
            if (existingCode) {
                return res.status(400).json({
                    success: false,
                    message: message.existe_periode_en
                });
            }
        }

        const isInteger = Number.isInteger(annee);
        if (!isInteger) {
            return res.status(400).json({
                success: false,
                message: message.nombre_entier
            });
            
        }

        // Vérifier le chevauchement des dates
        const overlappingEvenements = await Evenement.find({
            _id: { $ne: evenementId }, // Exclure l'événement actuel de la recherche
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

        if (overlappingEvenements.length > 0) {
            return res.status(400).json({
                success: false,
                message: message.chevauchement
            });
        }

        // Mettre à jour l'événement
        existingEvenement.code = code;
        existingEvenement.libelleFr = libelleFr;
        existingEvenement.libelleEn = libelleEn;
        existingEvenement.dateDebut = dateDebut;
        existingEvenement.dateFin = dateFin;
        existingEvenement.periodeFr = periodeFr;
        existingEvenement.periodeEn = periodeEn;
        existingEvenement.etat = etat;
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
    const { page = 1, pageSize = 10 } = req.query; // Valeurs par défaut pour la pagination

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
        const evenements = await Evenement.find({ annee: numericAnnee })
            .skip(startIndex)
            .limit(parseInt(pageSize));

        // Compter le nombre total d'événements pour l'année spécifiée
        const totalEvenements = await Evenement.countDocuments({ annee: numericAnnee });

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
        const { nbEvenement=10 } = req.query;
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
    const { annee = 2024 } = req.params;
    const evenements = await Evenement.find({ annee: annee });
    const htmlContent = await fillTemplate(evenements, './templates/template_calendrier_fr.html', annee);

    // Générer le PDF à partir du contenu HTML
    generatePDFAndSendToBrowser(htmlContent, res, 'portrait');
}

async function fillTemplate (evenements, filePath, annee) {
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
            clonedRow.find('#libelle').text(event.libelleFr);
            clonedRow.find('#periode').text(event.periodeFr);
            clonedRow.find('#personnel').text(event.personnelFr);
            clonedRow.find('#description_observation').text(event.descriptionObservationFr);
            clonedRow.find('#fonction').text("");
            if(event.etat!=null && setting){
                clonedRow.find('#statut').text(setting.etatsEvenement.find((etat)=>etat._id.toString()===event.etat.toString())?.libelleFr??"");
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





