import express from 'express';
import {
    saisirNoteDiscipline,
    getNotesDisciplineByEvaluation,
    delibererDiscipline,
    publierNotesDiscipline,
    verrouillerNotesDiscipline,
    getMaNoteDiscipline,
    saisieRapideNoteDiscipline,
    getEtudiantsForDiscipline
} from '../controllers/evaluation/discipline.controller.js';

const router = express.Router();

/**
 * @route   GET /api/v1/discipline/etudiants/:evaluationId
 * @desc    Obtenir la liste des étudiants pour la saisie de discipline
 * @access  Admin, Enseignant
 */
router.get('/etudiants/:evaluationId', getEtudiantsForDiscipline);

/**
 * @route   POST /api/v1/discipline/saisir
 * @desc    Saisir une note de discipline
 * @access  Admin, Enseignant
 */
router.post('/saisir', saisirNoteDiscipline);

/**
 * @route   POST /api/v1/discipline/saisie-rapide
 * @desc    Saisie rapide d'une note de discipline (validation + enregistrement)
 * @access  Admin, Enseignant
 */
router.post('/saisie-rapide', saisieRapideNoteDiscipline);

/**
 * @route   GET /api/v1/discipline/:evaluationId
 * @desc    Obtenir toutes les notes de discipline d'une évaluation
 * @access  Admin, Enseignant
 */
router.get('/:evaluationId', getNotesDisciplineByEvaluation);

/**
 * @route   POST /api/v1/discipline/deliberer/:evaluationId
 * @desc    Délibérer les notes de discipline (valider)
 * @access  Admin
 */
router.post('/deliberer/:evaluationId', delibererDiscipline);

/**
 * @route   POST /api/v1/discipline/publier/:evaluationId
 * @desc    Publier les notes de discipline
 * @access  Admin
 */
router.post('/publier/:evaluationId', publierNotesDiscipline);

/**
 * @route   POST /api/v1/discipline/verrouiller/:evaluationId
 * @desc    Verrouiller les notes de discipline
 * @access  Admin
 */
router.post('/verrouiller/:evaluationId', verrouillerNotesDiscipline);

/**
 * @route   GET /api/v1/discipline/mes-notes/:evaluationId
 * @desc    Obtenir ma note de discipline (étudiant)
 * @access  Etudiant
 */
router.get('/mes-notes/:evaluationId', getMaNoteDiscipline);

export default router;