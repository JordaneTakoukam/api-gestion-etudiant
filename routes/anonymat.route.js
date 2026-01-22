// routes/anonymat.route.js - Routes mises à jour

import express from "express";

import {
    genererAnonymats,
    getAnonymatsByEvaluation,
    getNumerosAnonymatsByEvaluation,
    verifierAnonymat,
    invaliderAnonymat,
    getMonAnonymat,
    // NOUVELLES IMPORTATIONS
    getAnonymatsDisponibles,
    rechercherAnonymats,
    verifierAnonymatRapide
} from "../controllers/evaluation/anonymat.controller.js";

const router = express.Router();

/**
 * Générer les anonymats pour une évaluation
 * POST /api/v1/anonymat/generer/:evaluationId
 */
router.post("/generer/:evaluationId", genererAnonymats);

/**
 * Obtenir tous les anonymats d'une évaluation (avec identités étudiants)
 * GET /api/v1/anonymat/all/:evaluationId
 */
router.get("/all/:evaluationId", getAnonymatsByEvaluation);

/**
 * Obtenir les numéros d'anonymat (sans identités)
 * GET /api/v1/anonymat/numeros/:evaluationId
 */
router.get("/numeros/:evaluationId", getNumerosAnonymatsByEvaluation);

/**
 * NOUVELLE ROUTE - Obtenir les anonymats disponibles (non notés)
 * GET /api/v1/anonymat/disponibles/:evaluationId?matiereId=xxx
 */
router.get("/disponibles/:evaluationId", getAnonymatsDisponibles);

/**
 * NOUVELLE ROUTE - Rechercher des anonymats (autocomplétion)
 * GET /api/v1/anonymat/rechercher/:evaluationId?q=AN2024&matiereId=xxx
 */
router.get("/rechercher/:evaluationId", rechercherAnonymats);

/**
 * NOUVELLE ROUTE - Vérification rapide d'anonymat
 * GET /api/v1/anonymat/verifier-rapide/:numeroAnonymat?evaluationId=xxx&matiereId=xxx
 */
router.get("/verifier-rapide/:numeroAnonymat", verifierAnonymatRapide);

/**
 * Vérifier la validité d'un anonymat (route existante)
 * GET /api/v1/anonymat/verifier/:numeroAnonymat
 */
router.get("/verifier/:numeroAnonymat", verifierAnonymat);

/**
 * Invalider un anonymat
 * PUT /api/v1/anonymat/invalider/:anonymatId
 */
router.put("/invalider/:anonymatId", invaliderAnonymat);

/**
 * Obtenir mon anonymat (étudiant)
 * GET /api/v1/anonymat/mon-anonymat/:evaluationId
 */
router.get("/mon-anonymat/:evaluationId", getMonAnonymat);

export default router;

