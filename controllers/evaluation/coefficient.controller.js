import CoefficientMatiere from '../../models/coefficient_matiere.model.js';
import { message } from '../../configs/message.js';
import mongoose from 'mongoose';
import { 
    validerSemestreNiveauById, 
    getMessageErreurSemestre 
} from '../../utils/semestre_validator.js';

/**
 * Créer ou mettre à jour un coefficient de matière
 */
export const setCoefficient = async (req, res) => {
    const { matiere, niveau, annee, semestre, coefficient } = req.body;

    try {
        // Vérifications
        if (!matiere || !niveau || !annee || !semestre || coefficient === undefined) {
            return res.status(400).json({
                success: false,
                message: message.champ_obligatoire
            });
        }

        if (!mongoose.Types.ObjectId.isValid(matiere) || 
            !mongoose.Types.ObjectId.isValid(niveau)) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide
            });
        }

        if (coefficient < 0.5 || coefficient > 10) {
            return res.status(400).json({
                success: false,
                message: "Le coefficient doit être compris entre 0.5 et 10"
            });
        }

        // Valider que le semestre est autorisé pour ce niveau
        const validation = await validerSemestreNiveauById(niveau, semestre);
        
        if (!validation.valide) {
            return res.status(400).json({
                success: false,
                message: getMessageErreurSemestre(validation.niveau, semestre),
                data: {
                    semestresAutorises: validation.semestresAutorises,
                    semestreDemande: semestre
                }
            });
        }

        // Chercher si un coefficient existe déjà
        let coefficientMatiere = await CoefficientMatiere.findOne({
            matiere,
            niveau,
            annee,
            semestre
        });

        if (coefficientMatiere) {
            // Mise à jour
            coefficientMatiere.coefficient = coefficient;
            coefficientMatiere.dateModification = new Date();
            coefficientMatiere.modifiePar = req.user._id;
            await coefficientMatiere.save();

            return res.status(200).json({
                success: true,
                message: "Coefficient mis à jour avec succès",
                data: coefficientMatiere
            });
        } else {
            // Création
            coefficientMatiere = new CoefficientMatiere({
                matiere,
                niveau,
                annee,
                semestre,
                coefficient,
                modifiePar: req.user._id
            });

            await coefficientMatiere.save();

            return res.status(201).json({
                success: true,
                message: "Coefficient créé avec succès",
                data: coefficientMatiere
            });
        }
    } catch (error) {
        console.error('Erreur lors de la gestion du coefficient:', error);
        res.status(500).json({
            success: false,
            message: message.erreurServeur
        });
    }
};

/**
 * Obtenir le coefficient d'une matière
 */
export const getCoefficient = async (req, res) => {
    const { matiereId, niveauId } = req.params;
    const { annee, semestre } = req.query;

    try {
        if (!mongoose.Types.ObjectId.isValid(matiereId) || 
            !mongoose.Types.ObjectId.isValid(niveauId)) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide
            });
        }

        if (!annee || !semestre) {
            return res.status(400).json({
                success: false,
                message: "Année et semestre sont requis"
            });
        }

        const coefficient = await CoefficientMatiere.findOne({
            matiere: matiereId,
            niveau: niveauId,
            annee: parseInt(annee),
            semestre: parseInt(semestre)
        })
            .populate('matiere', 'libelleFr libelleEn')
            .populate('niveau');

        if (!coefficient) {
            return res.status(404).json({
                success: false,
                message: "Coefficient non trouvé",
                data: { coefficient: 1 } // Coefficient par défaut
            });
        }

        res.status(200).json({
            success: true,
            data: coefficient
        });
    } catch (error) {
        console.error('Erreur lors de la récupération du coefficient:', error);
        res.status(500).json({
            success: false,
            message: message.erreurServeur
        });
    }
};

/**
 * Obtenir tous les coefficients pour un niveau/année/semestre
 */
export const getCoefficientsByNiveau = async (req, res) => {
    const { niveauId } = req.params;
    const { annee, semestre, page = 1, pageSize = 50 } = req.query;

    try {
        if (!mongoose.Types.ObjectId.isValid(niveauId)) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide
            });
        }

        const filter = { niveau: niveauId };
        if (annee) filter.annee = parseInt(annee);
        if (semestre) filter.semestre = parseInt(semestre);

        const skip = (page - 1) * pageSize;

        const coefficients = await CoefficientMatiere.find(filter)
            .populate('matiere', 'libelleFr libelleEn code')
            .populate('niveau')
            .populate('modifiePar', 'nom prenom')
            .sort({ 'matiere.libelleFr': 1 })
            .skip(skip)
            .limit(parseInt(pageSize));

        const total = await CoefficientMatiere.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: {
                coefficients,
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / pageSize),
                totalItems: total,
                pageSize: parseInt(pageSize)
            }
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des coefficients:', error);
        res.status(500).json({
            success: false,
            message: message.erreurServeur
        });
    }
};

/**
 * Supprimer un coefficient
 */
export const deleteCoefficient = async (req, res) => {
    const { coefficientId } = req.params;

    try {
        if (!mongoose.Types.ObjectId.isValid(coefficientId)) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide
            });
        }

        const coefficient = await CoefficientMatiere.findByIdAndDelete(coefficientId);

        if (!coefficient) {
            return res.status(404).json({
                success: false,
                message: "Coefficient non trouvé"
            });
        }

        res.status(200).json({
            success: true,
            message: message.supprimer_avec_success
        });
    } catch (error) {
        console.error('Erreur lors de la suppression du coefficient:', error);
        res.status(500).json({
            success: false,
            message: message.erreurServeur
        });
    }
};

/**
 * Copier les coefficients d'une période vers une autre
 */
export const copierCoefficients = async (req, res) => {
    const { 
        niveauSource, 
        anneeSource, 
        semestreSource,
        niveauCible,
        anneeCible,
        semestreCible
    } = req.body;

    try {
        // Vérifications
        if (!niveauSource || !anneeSource || !semestreSource ||
            !niveauCible || !anneeCible || !semestreCible) {
            return res.status(400).json({
                success: false,
                message: message.champ_obligatoire
            });
        }

        // Récupérer les coefficients source
        const coefficientsSource = await CoefficientMatiere.find({
            niveau: niveauSource,
            annee: anneeSource,
            semestre: semestreSource
        });

        if (coefficientsSource.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Aucun coefficient trouvé pour la période source"
            });
        }

        let coefficientsCrees = 0;
        let coefficientsMisAJour = 0;

        for (const coeffSrc of coefficientsSource) {
            // Chercher si un coefficient existe déjà pour la cible
            const coeffExistant = await CoefficientMatiere.findOne({
                matiere: coeffSrc.matiere,
                niveau: niveauCible,
                annee: anneeCible,
                semestre: semestreCible
            });

            if (coeffExistant) {
                // Mise à jour
                coeffExistant.coefficient = coeffSrc.coefficient;
                coeffExistant.dateModification = new Date();
                coeffExistant.modifiePar = req.user._id;
                await coeffExistant.save();
                coefficientsMisAJour++;
            } else {
                // Création
                const nouveauCoeff = new CoefficientMatiere({
                    matiere: coeffSrc.matiere,
                    niveau: niveauCible,
                    annee: anneeCible,
                    semestre: semestreCible,
                    coefficient: coeffSrc.coefficient,
                    modifiePar: req.user._id
                });
                await nouveauCoeff.save();
                coefficientsCrees++;
            }
        }

        res.status(200).json({
            success: true,
            message: "Coefficients copiés avec succès",
            data: {
                coefficientsCrees,
                coefficientsMisAJour,
                total: coefficientsCrees + coefficientsMisAJour
            }
        });
    } catch (error) {
        console.error('Erreur lors de la copie des coefficients:', error);
        res.status(500).json({
            success: false,
            message: message.erreurServeur
        });
    }
};