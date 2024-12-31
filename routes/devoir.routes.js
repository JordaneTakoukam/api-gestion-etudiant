import express from "express";
import { createDevoir, deleteDevoir, getDevoirsByEnseignantPaginated, getDevoirsByNiveauPaginated, getDevoirStats, searchDevoir, searchDevoirByEnseignant, updateDevoir, voirStatistiquesDevoir } from "../controllers/devoirs/devoir.controller.js";
import { createQuestion, deleteQuestion, obtenirQuestionsDevoir, obtenirQuestionsDevoirAvecPagination, searchQuestion, updateQuestion } from "../controllers/devoirs/question.controller.js";
import { obtenirTentativesEtudiant, soumettreTentative } from "../controllers/devoirs/reponse.controller.js";



const router = express.Router();

router.post("/create", createDevoir);
router.put("/update/:id", updateDevoir);
router.delete("/delete/:id", deleteDevoir);
router.get("/getDevoirsByNiveauPaginated/:niveauId", getDevoirsByNiveauPaginated);
router.get("/getDevoirsByEnseignantPaginated/:enseignantId", getDevoirsByEnseignantPaginated);
router.get("/voirStatistiquesDevoir/:devoirId", voirStatistiquesDevoir);
router.get("/getDevoirStats/:devoirId", getDevoirStats);
router.get("/searchDevoir/:langue/:searchString", searchDevoir);
router.get("/searchDevoirByEnseignant/:langue/:searchString", searchDevoirByEnseignant);

router.post("/question/create", createQuestion);
router.put("/question/update/:id", updateQuestion);
router.delete("/question/delete/:id", deleteQuestion);
router.get("/question/obtenirQuestionsDevoirAvecPagination/:devoirId", obtenirQuestionsDevoirAvecPagination)
router.get("/question/obtenirQuestionsDevoir/:devoirId", obtenirQuestionsDevoir)
router.get("/question/searchQuestion/:langue/:searchString", searchQuestion);

router.post("/reponse/soumettreTentative/:devoirId", soumettreTentative);
router.get("/reponse/obtenirTentativesEtudiant/:devoirId/:etudiantId", obtenirTentativesEtudiant)


export default router;