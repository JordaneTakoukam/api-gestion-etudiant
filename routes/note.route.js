import express from "express";

import {
    saisirNote,
    getNotesByEvaluationMatiere,
    delibererEvaluation,
    publierResultats,
    verrouillerNotes,
    getMesNotes,
    calculerMoyennesEvaluation,
    getResultatsDetaillesEvaluation,
    getMesResultatsDetailles,
    exporterResultatsExcel,
    // NOUVELLE IMPORTATION
    saisieRapideNote
} from "../controllers/evaluation/note.controller.js";

const router = express.Router();

/**
 * Saisir une note via anonymat (route existante)
 * POST /api/v1/note/saisir
 */
router.post("/saisir", saisirNote);

/**
 * NOUVELLE ROUTE - Saisie rapide (validation + enregistrement)
 * POST /api/v1/note/saisie-rapide
 */
router.post("/saisie-rapide", saisieRapideNote);

/**
 * Délibérer une évaluation (rattacher notes aux étudiants)
 * POST /api/v1/note/deliberer/:evaluationId
 */
router.post("/deliberer/:evaluationId", delibererEvaluation);

/**
 * Publier les résultats
 * POST /api/v1/note/publier/:evaluationId
 */
router.post("/publier/:evaluationId", publierResultats);

/**
 * Verrouiller les notes
 * POST /api/v1/note/verrouiller/:evaluationId
 */
router.post("/verrouiller/:evaluationId", verrouillerNotes);

/**
 * Obtenir mes notes (étudiant)
 * GET /api/v1/note/mes-notes/:evaluationId
 */
router.get("/mes-notes/:evaluationId", getMesNotes);

/**
 * Calculer les moyennes de tous les étudiants
 * GET /api/v1/note/moyennes/:evaluationId
 */
router.get("/moyennes/:evaluationId", calculerMoyennesEvaluation);

/**
 * Obtenir les résultats détaillés
 * GET /api/v1/note/resultats/:evaluationId
 */
router.get('/resultats/:evaluationId', getResultatsDetaillesEvaluation);

/**
 * Obtenir mes résultats détaillés
 * GET /api/v1/note/mes-resultats/:evaluationId
 */
router.get('/mes-resultats/:evaluationId', getMesResultatsDetailles);

/**
 * Exporter en Excel
 * GET /api/v1/note/export-excel/:evaluationId
 */
router.get('/export-excel/:evaluationId', exporterResultatsExcel);

/**
 * Obtenir les notes d'une évaluation pour une matière
 * GET /api/v1/note/:evaluationId/:matiereId
 */
router.get("/:evaluationId/:matiereId", getNotesByEvaluationMatiere);

export default router;