import CoefficientDiscipline from '../../models/coefficient_discipline.model.js';
import { message } from '../../configs/message.js';
import mongoose from 'mongoose';
import { 
    validerSemestreNiveauById, 
    getMessageErreurSemestre 
} from '../../utils/semestre_validator.js';

/**
 * Créer ou mettre à jour un coefficient de discipline
 */
export const setCoefficientDiscipline = async (req, res) => {
    const { niveau, annee, semestre, coefficient, modifiePar } = req.body;

    try {
        // Vérifications
        if (!niveau || !annee || !semestre || coefficient === undefined) {
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

        if (coefficient < 0.5 || coefficient > 5) {
            return res.status(400).json({
                success: false,
                message: {
                    fr: "Le coefficient de discipline doit être compris entre 0.5 et 5",
                    en: "Discipline coefficient must be between 0.5 and 5"
                }
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
        let coefficientDiscipline = await CoefficientDiscipline.findOne({
            niveau,
            annee,
            semestre
        });

        if (coefficientDiscipline) {
            // Mise à jour
            coefficientDiscipline.coefficient = coefficient;
            coefficientDiscipline.dateModification = new Date();
            coefficientDiscipline.modifiePar = modifiePar;
            await coefficientDiscipline.save();

            return res.status(200).json({
                success: true,
                message: message.mis_a_jour,
                data: coefficientDiscipline
            });
        } else {
            // Création
            coefficientDiscipline = new CoefficientDiscipline({
                niveau,
                annee,
                semestre,
                coefficient,
                modifiePar: modifiePar
            });

            await coefficientDiscipline.save();

            return res.status(201).json({
                success: true,
                message: message.ajouter_avec_success,
                data: coefficientDiscipline
            });
        }
    } catch (error) {
        console.error('Erreur lors de la gestion du coefficient de discipline:', error);
        res.status(500).json({
            success: false,
            message: message.erreurServeur
        });
    }
};

/**
 * Obtenir le coefficient de discipline
 */
export const getCoefficientDiscipline = async (req, res) => {
    const { niveauId } = req.params;
    const { annee, semestre } = req.query;

    try {
        if (!mongoose.Types.ObjectId.isValid(niveauId)) {
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

        const coefficient = await CoefficientDiscipline.findOne({
            niveau: niveauId,
            annee: parseInt(annee),
            semestre: parseInt(semestre)
        }).populate('modifiePar', 'nom prenom');

        if (!coefficient) {
            return res.status(404).json({
                success: false,
                message: "Coefficient de discipline non trouvé",
                data: { coefficient: 1 } // Coefficient par défaut
            });
        }

        res.status(200).json({
            success: true,
            data: coefficient
        });
    } catch (error) {
        console.error('Erreur lors de la récupération du coefficient de discipline:', error);
        res.status(500).json({
            success: false,
            message: message.erreurServeur
        });
    }
};

/**
 * Obtenir tous les coefficients de discipline pour un niveau
 */
export const getCoefficientsDisciplineByNiveau = async (req, res) => {
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

        const coefficients = await CoefficientDiscipline.find(filter)
            .populate('niveau', 'libelleFr libelleEn')
            .populate('modifiePar', 'nom prenom')
            .sort({ annee: -1, semestre: -1 })
            .skip(skip)
            .limit(parseInt(pageSize));

        const total = await CoefficientDiscipline.countDocuments(filter);

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
        console.error('Erreur lors de la récupération des coefficients de discipline:', error);
        res.status(500).json({
            success: false,
            message: message.erreurServeur
        });
    }
};

/**
 * Supprimer un coefficient de discipline
 */
export const deleteCoefficientDiscipline = async (req, res) => {
    const { coefficientId } = req.params;

    try {
        if (!mongoose.Types.ObjectId.isValid(coefficientId)) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide
            });
        }

        const coefficient = await CoefficientDiscipline.findByIdAndDelete(coefficientId);

        if (!coefficient) {
            return res.status(404).json({
                success: false,
                message: "Coefficient de discipline non trouvé"
            });
        }

        res.status(200).json({
            success: true,
            message: message.supprimer_avec_success
        });
    } catch (error) {
        console.error('Erreur lors de la suppression du coefficient de discipline:', error);
        res.status(500).json({
            success: false,
            message: message.erreurServeur
        });
    }
};

/**
 * Copier les coefficients de discipline d'une période vers une autre
 */
export const copierCoefficientsDiscipline = async (req, res) => {
    const { 
        niveauSource, 
        anneeSource, 
        semestreSource,
        niveauCible,
        anneeCible,
        semestreCible,
        modifiePar
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

        // Récupérer le coefficient source
        const coefficientSource = await CoefficientDiscipline.findOne({
            niveau: niveauSource,
            annee: anneeSource,
            semestre: semestreSource
        });

        if (!coefficientSource) {
            return res.status(404).json({
                success: false,
                message: "Aucun coefficient de discipline trouvé pour la période source"
            });
        }

        // Chercher si un coefficient existe déjà pour la cible
        const coeffExistant = await CoefficientDiscipline.findOne({
            niveau: niveauCible,
            annee: anneeCible,
            semestre: semestreCible
        });

        if (coeffExistant) {
            // Mise à jour
            coeffExistant.coefficient = coefficientSource.coefficient;
            coeffExistant.dateModification = new Date();
            coeffExistant.modifiePar = modifiePar;
            await coeffExistant.save();

            return res.status(200).json({
                success: true,
                message: "Coefficient de discipline copié et mis à jour avec succès",
                data: coeffExistant
            });
        } else {
            // Création
            const nouveauCoeff = new CoefficientDiscipline({
                niveau: niveauCible,
                annee: anneeCible,
                semestre: semestreCible,
                coefficient: coefficientSource.coefficient,
                modifiePar: modifiePar
            });
            await nouveauCoeff.save();

            return res.status(201).json({
                success: true,
                message: "Coefficient de discipline copié avec succès",
                data: nouveauCoeff
            });
        }
    } catch (error) {
        console.error('Erreur lors de la copie du coefficient de discipline:', error);
        res.status(500).json({
            success: false,
            message: message.erreurServeur
        });
    }
};

/**
 * Obtenir le coefficient de discipline le plus récent pour un niveau
 */
export const getLatestCoefficientDiscipline = async (req, res) => {
    const { niveauId } = req.params;

    try {
        // Validation de l'ID
        if (!mongoose.Types.ObjectId.isValid(niveauId)) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide
            });
        }

        // Rechercher le coefficient le plus récent
        const coefficient = await CoefficientDiscipline.findOne({
            niveau: niveauId
        })
            .populate('niveau', 'libelleFr libelleEn')
            .populate('modifiePar', 'nom prenom')
            .sort({ annee: -1, semestre: -1, dateModification: -1 })
            .limit(1);

        if (!coefficient) {
            return res.status(404).json({
                success: false,
                message: "Coefficient de discipline non trouvé",
                data: { 
                    coefficient: 1 // Coefficient par défaut
                }
            });
        }

        res.status(200).json({
            success: true,
            data: coefficient
        });
    } catch (error) {
        console.error('Erreur lors de la récupération du coefficient de discipline le plus récent:', error);
        res.status(500).json({
            success: false,
            message: message.erreurServeur
        });
    }
};