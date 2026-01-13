import Anonymat from '../../models/anonymat.model.js';
import Evaluation from '../../models/evaluation.model.js';
import User from '../../models/user.model.js';
import { message } from '../../configs/message.js';
import { appConfigs } from '../../configs/app_configs.js';
import mongoose from 'mongoose';

/**
 * Générer automatiquement les anonymats pour une évaluation
 */
export const genererAnonymats = async (req, res) => {
    const { evaluationId } = req.params;

    try {
        // Vérifier l'ID
        if (!mongoose.Types.ObjectId.isValid(evaluationId)) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide
            });
        }

        // Récupérer l'évaluation
        const evaluation = await Evaluation.findById(evaluationId);
        if (!evaluation) {
            return res.status(404).json({
                success: false,
                message: message.evaluation_non_trouvee
            });
        }

        // Vérifier si les anonymats ont déjà été générés
        if (evaluation.anonymatsGeneres) {
            return res.status(400).json({
                success: false,
                message: message.anonymats_deja_generes
            });
        }

        // Récupérer tous les étudiants du niveau concerné pour l'année donnée
        const etudiants = await User.find({
            roles: { $in: [appConfigs.role.etudiant] },
            'niveaux.niveau': evaluation.niveau,
            'niveaux.annee': evaluation.annee
        });

        if (etudiants.length === 0) {
            return res.status(404).json({
                success: false,
                message: message.etudiant_non_trouvee
            });
        }

        // Générer les anonymats
        const anonymatsGeneres = [];
        for (const etudiant of etudiants) {
            // Générer un numéro d'anonymat unique
            const numeroAnonymat = await Anonymat.genererNumeroAnonymat(evaluationId);

            const anonymat = new Anonymat({
                evaluation: evaluationId,
                etudiant: etudiant._id,
                numeroAnonymat,
                niveau: evaluation.niveau,
                statut: 'ACTIF'
            });

            const anonymatSauvegarde = await anonymat.save();
            anonymatsGeneres.push(anonymatSauvegarde);
        }

        // Mettre à jour l'évaluation
        evaluation.anonymatsGeneres = true;
        evaluation.dateGenerationAnonymats = new Date();
        await evaluation.save();

        res.status(201).json({
            success: true,
            message: `${anonymatsGeneres.length} ${message.anonymats_generes_succes}`,
            data: {
                nombreAnonymats: anonymatsGeneres.length,
                evaluationId: evaluation._id
            }
        });
    } catch (error) {
        console.error('Erreur lors de la génération des anonymats:', error);
        res.status(500).json({ 
            success: false, 
            message: message.erreurServeur 
        });
    }
};

/**
 * Obtenir tous les anonymats d'une évaluation (ADMIN uniquement)
 */
export const getAnonymatsByEvaluation = async (req, res) => {
    const { evaluationId } = req.params;
    const { page = 1, pageSize = 50 } = req.query;

    try {
        if (!mongoose.Types.ObjectId.isValid(evaluationId)) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide
            });
        }

        // IMPORTANT: Cette route doit être protégée pour les administrateurs uniquement
        // Vérifier que l'utilisateur a le rôle admin
        // if (!req.user.roles.includes(appConfigs.role.admin) && 
        //     !req.user.roles.includes(appConfigs.role.superAdmin)) {
        //     return res.status(403).json({
        //         success: false,
        //         message: "Accès refusé. Réservé aux administrateurs."
        //     });
        // }

        const skip = (page - 1) * pageSize;

        const anonymats = await Anonymat.find({ evaluation: evaluationId })
            .populate('etudiant', 'nom prenom matricule email')
            .sort({ numeroAnonymat: 1 })
            .skip(skip)
            .limit(parseInt(pageSize));

        const total = await Anonymat.countDocuments({ evaluation: evaluationId });

        res.status(200).json({
            success: true,
            data: {
                anonymats,
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / pageSize),
                totalItems: total,
                pageSize: parseInt(pageSize)
            }
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des anonymats:', error);
        res.status(500).json({ 
            success: false, 
            message: message.erreurServeur 
        });
    }
};

/**
 * Obtenir uniquement les numéros d'anonymat (pour les enseignants)
 */
export const getNumerosAnonymatsByEvaluation = async (req, res) => {
    const { evaluationId } = req.params;
    const { page = 1, pageSize = 50 } = req.query;

    try {
        if (!mongoose.Types.ObjectId.isValid(evaluationId)) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide
            });
        }

        const skip = (page - 1) * pageSize;

        // Retourner UNIQUEMENT les numéros d'anonymat, sans les informations des étudiants
        const anonymats = await Anonymat.find({ evaluation: evaluationId })
            .select('numeroAnonymat statut utilise')
            .sort({ numeroAnonymat: 1 })
            .skip(skip)
            .limit(parseInt(pageSize));

        const total = await Anonymat.countDocuments({ evaluation: evaluationId });

        res.status(200).json({
            success: true,
            data: {
                anonymats,
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / pageSize),
                totalItems: total,
                pageSize: parseInt(pageSize)
            }
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des numéros d\'anonymat:', error);
        res.status(500).json({ 
            success: false, 
            message: message.erreurServeur 
        });
    }
};

/**
 * Vérifier la validité d'un numéro d'anonymat
 */
export const verifierAnonymat = async (req, res) => {
    const { numeroAnonymat } = req.params;
    const { evaluationId } = req.query;

    try {
        const query = { numeroAnonymat };
        if (evaluationId) {
            if (!mongoose.Types.ObjectId.isValid(evaluationId)) {
                return res.status(400).json({
                    success: false,
                    message: message.identifiant_invalide
                });
            }
            query.evaluation = evaluationId;
        }

        const anonymat = await Anonymat.findOne(query);

        if (!anonymat) {
            return res.status(404).json({
                success: false,
                message: message.anonymat_invalide_inexistant,
                valide: false
            });
        }

        if (anonymat.invalide) {
            return res.status(400).json({
                success: false,
                message: message.anonymat_invalider,
                valide: false,
                raison: anonymat.raisonInvalidation
            });
        }

        res.status(200).json({
            success: true,
            message: message.anonymat_valide,
            valide: true,
            data: {
                numeroAnonymat: anonymat.numeroAnonymat,
                statut: anonymat.statut,
                utilise: anonymat.utilise
            }
        });
    } catch (error) {
        console.error('Erreur lors de la vérification de l\'anonymat:', error);
        res.status(500).json({ 
            success: false, 
            message: message.erreurServeur 
        });
    }
};

/**
 * Invalider un anonymat (en cas de fraude, abandon, etc.)
 */
export const invaliderAnonymat = async (req, res) => {
    const { anonymatId } = req.params;
    const { raison } = req.body;

    try {
        if (!mongoose.Types.ObjectId.isValid(anonymatId)) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide
            });
        }

        const anonymat = await Anonymat.findById(anonymatId);
        if (!anonymat) {
            return res.status(404).json({
                success: false,
                message: message.anonymat_non_trouve
            });
        }

        anonymat.invalide = true;
        anonymat.raisonInvalidation = raison;
        anonymat.dateInvalidation = new Date();
        anonymat.invalidePar = req.user._id;
        anonymat.statut = 'ANNULE';

        await anonymat.save();

        res.status(200).json({
            success: true,
            message: message.anonymat_invalide_succes,
            data: anonymat
        });
    } catch (error) {
        console.error('Erreur lors de l\'invalidation de l\'anonymat:', error);
        res.status(500).json({ 
            success: false, 
            message: message.erreurServeur 
        });
    }
};

/**
 * Obtenir l'anonymat d'un étudiant pour une évaluation (étudiant uniquement)
 */
export const getMonAnonymat = async (req, res) => {
    const { evaluationId } = req.params;

    try {
        if (!mongoose.Types.ObjectId.isValid(evaluationId)) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide
            });
        }

        // L'étudiant ne peut voir que son propre anonymat
        const anonymat = await Anonymat.findOne({
            evaluation: evaluationId,
            etudiant: req.user._id
        }).select('numeroAnonymat statut dateGeneration');

        if (!anonymat) {
            return res.status(404).json({
                success: false,
                message: message.anonymat_non_trouve
            });
        }

        res.status(200).json({
            success: true,
            data: anonymat
        });
    } catch (error) {
        console.error('Erreur lors de la récupération de l\'anonymat:', error);
        res.status(500).json({ 
            success: false, 
            message: message.erreurServeur 
        });
    }
};