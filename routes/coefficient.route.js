import express from "express";

// Controllers


import {
    setCoefficient,
    getCoefficient,
    getCoefficientsByNiveau,
    deleteCoefficient,
    copierCoefficients
} from "../controllers/evaluation/coefficient.controller.js";


// Middlewares (à créer ou adapter)
// import { verifyToken } from "../middlewares/auth.middleware.js";
// import { checkRole } from "../middlewares/role.middleware.js";

const router = express.Router();

/**
 * Créer ou mettre à jour un coefficient
 * POST /api/v1/evaluation/coefficient/set
 * Rôles: Admin, SuperAdmin
 */
router.post("/set", setCoefficient);

/**
 * Obtenir tous les coefficients d'un niveau
 * GET /api/v1/evaluation/coefficient/niveau/:niveauId
 * Rôles: Tous
 */
router.get("/niveau/:niveauId", getCoefficientsByNiveau);

/**
 * Obtenir un coefficient spécifique
 * GET /api/v1/evaluation/coefficient/:matiereId/:niveauId
 * Rôles: Tous
 */
router.get("/:matiereId/:niveauId", getCoefficient);



/**
 * Supprimer un coefficient
 * DELETE /api/v1/evaluation/coefficient/delete/:coefficientId
 * Rôles: Admin, SuperAdmin
 */
router.delete("/delete/:coefficientId", deleteCoefficient);

/**
 * Copier les coefficients d'une période vers une autre
 * POST /api/v1/evaluation/coefficient/copier
 * Rôles: Admin, SuperAdmin
 */
router.post("/copier", copierCoefficients);


export default router;