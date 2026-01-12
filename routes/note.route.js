import express from "express";



import {
    saisirNote,
    getNotesByEvaluationMatiere,
    delibererEvaluation,
    publierResultats,
    verrouillerNotes,
    getMesNotes,
    calculerMoyennesEvaluation
} from "../controllers/evaluation/note.controller.js";


// Middlewares (à créer ou adapter)
// import { verifyToken } from "../middlewares/auth.middleware.js";
// import { checkRole } from "../middlewares/role.middleware.js";

const router = express.Router();



/**
 * Saisir une note via anonymat
 * POST /api/v1/note/saisir
 * Rôles: Enseignant, Admin, SuperAdmin
 */
router.post("/saisir", saisirNote);


/**
 * Délibérer une évaluation (rattacher notes aux étudiants)
 * POST /api/v1/note/deliberer/:evaluationId
 * Rôles: Admin, SuperAdmin UNIQUEMENT
 */
router.post("/deliberer/:evaluationId", delibererEvaluation);

/**
 * Publier les résultats
 * POST /api/v1/note/publier/:evaluationId
 * Rôles: Admin, SuperAdmin
 */
router.post("/publier/:evaluationId", publierResultats);

/**
 * Verrouiller les notes
 * POST /api/v1/note/verrouiller/:evaluationId
 * Rôles: Admin, SuperAdmin
 */
router.post("/verrouiller/:evaluationId", verrouillerNotes);

/**
 * Obtenir mes notes (étudiant)
 * GET /api/v1/note/mes-notes/:evaluationId
 * Rôles: Étudiant
 */
router.get("/mes-notes/:evaluationId", getMesNotes);

/**
 * Calculer les moyennes de tous les étudiants
 * GET /api/v1/note/moyennes/:evaluationId
 * Rôles: Admin, SuperAdmin
 */
router.get("/moyennes/:evaluationId", calculerMoyennesEvaluation);

/**
 * Obtenir les notes d'une évaluation pour une matière
 * GET /api/v1/note/:evaluationId/:matiereId
 * Rôles: Enseignant, Admin, SuperAdmin
 */
router.get("/:evaluationId/:matiereId", getNotesByEvaluationMatiere);



export default router;