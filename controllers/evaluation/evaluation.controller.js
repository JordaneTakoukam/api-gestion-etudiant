import Evaluation from '../../models/evaluation.model.js';
import CoefficientMatiere from '../../models/coefficient_matiere.model.js';
import Anonymat from '../../models/anonymat.model.js';
import User from '../../models/user.model.js';
import { message } from '../../configs/message.js';
import mongoose from 'mongoose';
import { 
    validerSemestreNiveauById, 
    getMessageErreurSemestre 
} from '../../utils/semestre_validator.js';

/**
 * Créer une nouvelle évaluation
 */
export const createEvaluation = async (req, res) => {
    const {
        libelleFr,
        libelleEn,
        descriptionFr,
        descriptionEn,
        type,
        statut,
        niveau,
        annee,
        semestre,
        matieres, // Array de { matiere: id, coefficient: number }
        dateEpreuve,
        dateLimiteSaisie,
        noteMax,
        noteMin,
        creePar
    } = req.body;

    try {
        // Vérifications des champs obligatoires
        if (!libelleFr || !libelleEn || !niveau || !annee || !semestre || !matieres || matieres.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: message.champ_obligatoire 
            });
        }

        // Vérifier la validité du niveau
        if (!mongoose.Types.ObjectId.isValid(niveau)) {
            return res.status(400).json({
                success: false,
                message: message.niveau_invalide
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

        // Vérifier la validité des matières
        for (const mat of matieres) {
            if (!mongoose.Types.ObjectId.isValid(mat.matiere)) {
                return res.status(400).json({
                    success: false,
                    message: message.identifiant_invalide
                });
            }
            
            if (!mat.coefficient || mat.coefficient <= 0) {
                return res.status(400).json({
                    success: false,
                    message: "Coefficient invalide pour une des matières"
                });
            }
        }

        // Créer l'évaluation
        const nouvelleEvaluation = new Evaluation({
            libelleFr,
            libelleEn,
            descriptionFr,
            descriptionEn,
            type: type || 'CONTROLE_CONTINU',
            niveau,
            annee,
            semestre,
            matieres,
            dateEpreuve,
            dateLimiteSaisie,
            noteMax: noteMax || 20,
            noteMin: noteMin || 0,
            creePar: creePar, // Supposant que l'utilisateur est dans req.user
            statut: statut || 'BROUILLON'
        });

        const evaluationSauvegardee = await nouvelleEvaluation.save();

        res.status(201).json({
            success: true,
            message: message.ajouter_avec_success,
            data: evaluationSauvegardee
        });
    } catch (error) {
        console.error('Erreur lors de la création de l\'évaluation:', error);
        res.status(500).json({ 
            success: false, 
            message: message.erreurServeur 
        });
    }
};

/**
 * Mettre à jour une évaluation
 */
export const updateEvaluation = async (req, res) => {
    const { evaluationId } = req.params;
    const updateData = req.body;

    try {
        // Vérifier l'ID
        if (!mongoose.Types.ObjectId.isValid(evaluationId)) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide
            });
        }

        // Trouver l'évaluation
        const evaluation = await Evaluation.findById(evaluationId);
        if (!evaluation) {
            return res.status(404).json({
                success: false,
                message: "Évaluation non trouvée"
            });
        }

        // Empêcher la modification si les notes sont verrouillées
        if (evaluation.notesVerrouillees) {
            return res.status(403).json({
                success: false,
                message: "Impossible de modifier une évaluation dont les notes sont verrouillées"
            });
        }

        // Mettre à jour
        const evaluationMiseAJour = await Evaluation.findByIdAndUpdate(
            evaluationId,
            updateData,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: message.mis_a_jour,
            data: evaluationMiseAJour
        });
    } catch (error) {
        console.error('Erreur lors de la mise à jour de l\'évaluation:', error);
        res.status(500).json({ 
            success: false, 
            message: message.erreurServeur 
        });
    }
};

/**
 * Obtenir les évaluations par niveau, année et semestre
 */
export const getEvaluationsByNiveau = async (req, res) => {
    const { niveauId } = req.params;
    const { annee, semestre, page = 1, pageSize = 10 } = req.query;

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

        const evaluations = await Evaluation.find(filter)
            // .populate('niveau')
            .populate('matieres.matiere')
            .populate('creePar', 'nom prenom email')
            .sort({ dateCreation: -1 })
            .skip(skip)
            .limit(parseInt(pageSize));

        const total = await Evaluation.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: {
                evaluations,
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / pageSize),
                totalItems: total,
                pageSize: parseInt(pageSize)
            }
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des évaluations:', error);
        res.status(500).json({ 
            success: false, 
            message: message.erreurServeur 
        });
    }
};

/**
 * Supprimer une évaluation
 */
export const deleteEvaluation = async (req, res) => {
    const { evaluationId } = req.params;

    try {
        if (!mongoose.Types.ObjectId.isValid(evaluationId)) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide
            });
        }

        const evaluation = await Evaluation.findById(evaluationId);
        if (!evaluation) {
            return res.status(404).json({
                success: false,
                message: "Évaluation non trouvée"
            });
        }

        // Empêcher la suppression si des notes existent
        if (evaluation.statut !== 'BROUILLON') {
            return res.status(403).json({
                success: false,
                message: "Impossible de supprimer une évaluation qui n'est pas en brouillon"
            });
        }

        await Evaluation.findByIdAndDelete(evaluationId);

        res.status(200).json({
            success: true,
            message: message.supprimer_avec_success
        });
    } catch (error) {
        console.error('Erreur lors de la suppression de l\'évaluation:', error);
        res.status(500).json({ 
            success: false, 
            message: message.erreurServeur 
        });
    }
};

/**
 * Changer le statut d'une évaluation
 */
export const changerStatutEvaluation = async (req, res) => {
    const { evaluationId } = req.params;
    const { statut } = req.body;

    try {
        if (!mongoose.Types.ObjectId.isValid(evaluationId)) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide
            });
        }

        const statutsValides = ['BROUILLON', 'PROGRAMMEE', 'EN_COURS', 'CORRECTION', 'DELIBERATION', 'PUBLIEE', 'VERROUILEE'];
        if (!statutsValides.includes(statut)) {
            return res.status(400).json({
                success: false,
                message: "Statut invalide"
            });
        }

        const evaluation = await Evaluation.findByIdAndUpdate(
            evaluationId,
            { statut },
            { new: true }
        );

        if (!evaluation) {
            return res.status(404).json({
                success: false,
                message: "Évaluation non trouvée"
            });
        }

        res.status(200).json({
            success: true,
            message: "Statut mis à jour avec succès",
            data: evaluation
        });
    } catch (error) {
        console.error('Erreur lors du changement de statut:', error);
        res.status(500).json({ 
            success: false, 
            message: message.erreurServeur 
        });
    }
};