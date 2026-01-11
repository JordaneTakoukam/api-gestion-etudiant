import express from "express";

// Controllers
import {
    createEvaluation,
    updateEvaluation,
    getEvaluationsByNiveau,
    deleteEvaluation,
    changerStatutEvaluation
} from "../controllers/evaluation/evaluation.controller.js";

import {
    genererAnonymats,
    getAnonymatsByEvaluation,
    getNumerosAnonymatsByEvaluation,
    verifierAnonymat,
    invaliderAnonymat,
    getMonAnonymat
} from "../controllers/evaluation/anonymat.controller.js";

import {
    saisirNote,
    getNotesByEvaluationMatiere,
    delibererEvaluation,
    publierResultats,
    verrouillerNotes,
    getMesNotes,
    calculerMoyennesEvaluation
} from "../controllers/evaluation/note.controller.js";

import {
    setCoefficient,
    getCoefficient,
    getCoefficientsByNiveau,
    deleteCoefficient,
    copierCoefficients
} from "../controllers/evaluation/coefficient.controller.js";

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

// ========================================
// ROUTES ANONYMAT
// ========================================

/**
 * Générer les anonymats pour une évaluation
 * POST /api/v1/evaluation/anonymat/generer/:evaluationId
 * Rôles: Admin, SuperAdmin
 */
router.post("/anonymat/generer/:evaluationId", genererAnonymats);

/**
 * Obtenir tous les anonymats d'une évaluation (avec identités étudiants)
 * GET /api/v1/evaluation/anonymat/all/:evaluationId
 * Rôles: Admin, SuperAdmin UNIQUEMENT
 */
router.get("/anonymat/all/:evaluationId", getAnonymatsByEvaluation);

/**
 * Obtenir les numéros d'anonymat (sans identités)
 * GET /api/v1/evaluation/anonymat/numeros/:evaluationId
 * Rôles: Enseignant, Admin, SuperAdmin
 */
router.get("/anonymat/numeros/:evaluationId", getNumerosAnonymatsByEvaluation);

/**
 * Vérifier la validité d'un anonymat
 * GET /api/v1/evaluation/anonymat/verifier/:numeroAnonymat
 * Rôles: Enseignant, Admin, SuperAdmin
 */
router.get("/anonymat/verifier/:numeroAnonymat", verifierAnonymat);

/**
 * Invalider un anonymat
 * PUT /api/v1/evaluation/anonymat/invalider/:anonymatId
 * Rôles: Admin, SuperAdmin
 */
router.put("/anonymat/invalider/:anonymatId", invaliderAnonymat);

/**
 * Obtenir mon anonymat (étudiant)
 * GET /api/v1/evaluation/anonymat/mon-anonymat/:evaluationId
 * Rôles: Étudiant
 */
router.get("/anonymat/mon-anonymat/:evaluationId", getMonAnonymat);

// ========================================
// ROUTES NOTE
// ========================================

/**
 * Saisir une note via anonymat
 * POST /api/v1/evaluation/note/saisir
 * Rôles: Enseignant, Admin, SuperAdmin
 */
router.post("/note/saisir", saisirNote);

/**
 * Obtenir les notes d'une évaluation pour une matière
 * GET /api/v1/evaluation/note/:evaluationId/:matiereId
 * Rôles: Enseignant, Admin, SuperAdmin
 */
router.get("/note/:evaluationId/:matiereId", getNotesByEvaluationMatiere);

/**
 * Délibérer une évaluation (rattacher notes aux étudiants)
 * POST /api/v1/evaluation/note/deliberer/:evaluationId
 * Rôles: Admin, SuperAdmin UNIQUEMENT
 */
router.post("/note/deliberer/:evaluationId", delibererEvaluation);

/**
 * Publier les résultats
 * POST /api/v1/evaluation/note/publier/:evaluationId
 * Rôles: Admin, SuperAdmin
 */
router.post("/note/publier/:evaluationId", publierResultats);

/**
 * Verrouiller les notes
 * POST /api/v1/evaluation/note/verrouiller/:evaluationId
 * Rôles: Admin, SuperAdmin
 */
router.post("/note/verrouiller/:evaluationId", verrouillerNotes);

/**
 * Obtenir mes notes (étudiant)
 * GET /api/v1/evaluation/note/mes-notes/:evaluationId
 * Rôles: Étudiant
 */
router.get("/note/mes-notes/:evaluationId", getMesNotes);

/**
 * Calculer les moyennes de tous les étudiants
 * GET /api/v1/evaluation/note/moyennes/:evaluationId
 * Rôles: Admin, SuperAdmin
 */
router.get("/note/moyennes/:evaluationId", calculerMoyennesEvaluation);

// ========================================
// ROUTES COEFFICIENT
// ========================================

/**
 * Créer ou mettre à jour un coefficient
 * POST /api/v1/evaluation/coefficient/set
 * Rôles: Admin, SuperAdmin
 */
router.post("/coefficient/set", setCoefficient);

/**
 * Obtenir un coefficient spécifique
 * GET /api/v1/evaluation/coefficient/:matiereId/:niveauId
 * Rôles: Tous
 */
router.get("/coefficient/:matiereId/:niveauId", getCoefficient);

/**
 * Obtenir tous les coefficients d'un niveau
 * GET /api/v1/evaluation/coefficient/niveau/:niveauId
 * Rôles: Tous
 */
router.get("/coefficient/niveau/:niveauId", getCoefficientsByNiveau);

/**
 * Supprimer un coefficient
 * DELETE /api/v1/evaluation/coefficient/delete/:coefficientId
 * Rôles: Admin, SuperAdmin
 */
router.delete("/coefficient/delete/:coefficientId", deleteCoefficient);

/**
 * Copier les coefficients d'une période vers une autre
 * POST /api/v1/evaluation/coefficient/copier
 * Rôles: Admin, SuperAdmin
 */
router.post("/coefficient/copier", copierCoefficients);

// ========================================
// ROUTES INFORMATIONS SEMESTRES
// ========================================

/**
 * Obtenir les semestres autorisés pour un niveau
 * GET /api/v1/evaluation/semestres/niveau/:niveauId
 * Rôles: Tous
 */
router.get("/semestres/niveau/:niveauId", getSemestresByNiveau);

/**
 * Obtenir tous les semestres avec leurs niveaux associés
 * GET /api/v1/evaluation/semestres/all
 * Rôles: Tous
 */
router.get("/semestres/all", getAllSemestresInfo);

/**
 * Obtenir la configuration complète niveau-semestre
 * GET /api/v1/evaluation/semestres/configuration
 * Rôles: Tous
 */
router.get("/semestres/configuration", getConfigurationNiveauSemestre);

/**
 * Valider une combinaison niveau-semestre
 * GET /api/v1/evaluation/semestres/valider/:niveauId/:semestre
 * Rôles: Tous
 */
router.get("/semestres/valider/:niveauId/:semestre", validerCombinaisonNiveauSemestre);

export default router;