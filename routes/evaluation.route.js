import express from "express";

// Controllers
import {
    createEvaluation,
    updateEvaluation,
    getEvaluationsByNiveau,
    deleteEvaluation,
    changerStatutEvaluation
} from "../controllers/evaluation/evaluation.controller.js";


// Middlewares (à créer ou adapter)
// import { verifyToken } from "../middlewares/auth.middleware.js";
// import { checkRole } from "../middlewares/role.middleware.js";

const router = express.Router();

// ========================================
// ROUTES ÉVALUATION
// ========================================

/**
 * Créer une évaluation
 * POST /api/v1/evaluation/create
 * Rôles: Admin, SuperAdmin
 */
router.post("/create", createEvaluation);

/**
 * Mettre à jour une évaluation
 * PUT /api/v1/evaluation/update/:evaluationId
 * Rôles: Admin, SuperAdmin
 */
router.put("/update/:evaluationId", updateEvaluation);

/**
 * Obtenir les évaluations par niveau
 * GET /api/v1/evaluation/niveau/:niveauId
 * Rôles: Tous (filtrage selon rôle)
 */
router.get("/niveau/:niveauId", getEvaluationsByNiveau);

/**
 * Supprimer une évaluation
 * DELETE /api/v1/evaluation/delete/:evaluationId
 * Rôles: Admin, SuperAdmin
 */
router.delete("/delete/:evaluationId", deleteEvaluation);

/**
 * Changer le statut d'une évaluation
 * PUT /api/v1/evaluation/statut/:evaluationId
 * Rôles: Admin, SuperAdmin
 */
router.put("/statut/:evaluationId", changerStatutEvaluation);



export default router;