import PeriodeEnseignement from '../../models/periode_enseignement.model.js'
import { message } from '../../configs/message.js';
import mongoose from 'mongoose';
import { DateTime } from 'luxon';
const { ObjectId } = mongoose.Types;

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
            
                if (!mongoose.Types.ObjectId.isValid(enseignement.typeEnseignement)) {
                    return res.status(400).json({ 
                        success: false, 
                        message: message.identifiant_invalide,
                    });
                }
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
            return res.status(400).json({ 
                success: false, 
                message: message.identifiant_invalide,
            });
        }

        for (const enseignement of enseignements) {
            if (!mongoose.Types.ObjectId.isValid(enseignement.typeEnseignement)) {
                return res.status(400).json({ 
                    success: false, 
                    message: message.identifiant_invalide,
                });
            }
            if (!mongoose.Types.ObjectId.isValid(enseignement.matiere)) {
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

        res.status(200).json({ 
            success: true, 
            message: message.mis_a_jour,
            data: updatedPeriode
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

export const getPeriodesEnseignement = async (req, res) => {
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


