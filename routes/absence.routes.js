import express from "express";
import { ajouterAbsence, retirerAbsence } from "../controllers/abscences/absence.controller.js";
import { getAbsencesWithEnseignantsByFilter, getAbsencesWithEtudiantsByFilter } from "../controllers/abscences/get_absences.js";


// controllers

// middlewares

const router = express.Router();


router.get("/getAbsencesWithEnseignantsByFilter", getAbsencesWithEnseignantsByFilter);
router.get("/getAbsencesWithEtudiantsByFilter", getAbsencesWithEtudiantsByFilter);
router.post("/create/:userId", ajouterAbsence);
router.delete("/delete/:userId/:absenceId", retirerAbsence);



export default router;
