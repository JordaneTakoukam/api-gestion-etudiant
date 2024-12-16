import express from "express";
import { createDevoir, deleteDevoir, getDevoirsByNiveauPaginated, updateDevoir, voirStatistiquesDevoir } from "../controllers/devoirs/devoir.controller.js";
import { createQuestion, deleteQuestion, updateQuestion } from "../controllers/devoirs/question.controller.js";
import { obtenirTentativesEtudiant, soumettreTentative } from "../controllers/devoirs/reponse.controller.js";



const router = express.Router();

router.post("/create", createDevoir);
router.put("/update/:id", updateDevoir);
router.delete("/delete/:id", deleteDevoir);
router.get("/getDevoirsByNiveauPaginated/:niveauId", getDevoirsByNiveauPaginated)
router.get("/voirStatistiquesDevoir/:devoirId", voirStatistiquesDevoir)

router.post("/question/create", createQuestion);
router.put("/question/update/:id", updateQuestion);
router.delete("/question/delete/:id", deleteQuestion);

router.post("/reponse/soumettreTentative/:devoirId", soumettreTentative);
router.get("/reponse/obtenirTentativesEtudiant/:devoirId/:etudiantId", obtenirTentativesEtudiant)


export default router;