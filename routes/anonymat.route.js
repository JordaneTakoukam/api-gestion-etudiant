
import express from "express";

import {
    genererAnonymats,
    getAnonymatsByEvaluation,
    getNumerosAnonymatsByEvaluation,
    verifierAnonymat,
    invaliderAnonymat,
    getMonAnonymat
} from "../controllers/evaluation/anonymat.controller.js";


const router = express.Router();

/**
 * Générer les anonymats pour une évaluation
 * POST /api/v1/anonymat/generer/:evaluationId
 * Rôles: Admin, SuperAdmin
 */
router.post("/generer/:evaluationId", genererAnonymats);

/**
 * Obtenir tous les anonymats d'une évaluation (avec identités étudiants)
 * GET /api/v1/anonymat/all/:evaluationId
 * Rôles: Admin, SuperAdmin UNIQUEMENT
 */
router.get("/all/:evaluationId", getAnonymatsByEvaluation);

/**
 * Obtenir les numéros d'anonymat (sans identités)
 * GET /api/v1/anonymat/numeros/:evaluationId
 * Rôles: Enseignant, Admin, SuperAdmin
 */
router.get("/numeros/:evaluationId", getNumerosAnonymatsByEvaluation);

/**
 * Vérifier la validité d'un anonymat
 * GET /api/v1/anonymat/verifier/:numeroAnonymat
 * Rôles: Enseignant, Admin, SuperAdmin
 */
router.get("/verifier/:numeroAnonymat", verifierAnonymat);

/**
 * Invalider un anonymat
 * PUT /api/v1/anonymat/invalider/:anonymatId
 * Rôles: Admin, SuperAdmin
 */
router.put("/invalider/:anonymatId", invaliderAnonymat);

/**
 * Obtenir mon anonymat (étudiant)
 * GET /api/v1/anonymat/mon-anonymat/:evaluationId
 * Rôles: Étudiant
 */
router.get("/mon-anonymat/:evaluationId", getMonAnonymat);

export default router;