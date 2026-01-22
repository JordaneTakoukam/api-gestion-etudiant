import express from "express";

// Controllers


import {
    getSemestresByNiveau,
    getAllSemestresInfo,
    getConfigurationNiveauSemestre,
    validerCombinaisonNiveauSemestre
} from "../controllers/evaluation/semestre_info.controller.js";

// Middlewares (à créer ou adapter)
// import { verifyToken } from "../middlewares/auth.middleware.js";
// import { checkRole } from "../middlewares/role.middleware.js";

const router = express.Router();


/**
 * Obtenir les semestres autorisés pour un niveau
 * GET /api/v1/semestre/niveau/:niveauId
 * Rôles: Tous
 */
router.get("/niveau/:niveauId", getSemestresByNiveau);

/**
 * Obtenir tous les semestres avec leurs niveaux associés
 * GET /api/v1/semestre/all
 * Rôles: Tous
 */
router.get("/all", getAllSemestresInfo);

/**
 * Obtenir la configuration complète niveau-semestre
 * GET /api/v1/semestre/configuration
 * Rôles: Tous
 */
router.get("/configuration", getConfigurationNiveauSemestre);

/**
 * Valider une combinaison niveau-semestre
 * GET /api/v1/semestre/valider/:niveauId/:semestre
 * Rôles: Tous
 */
router.get("/valider/:niveauId/:semestre", validerCombinaisonNiveauSemestre);

export default router;