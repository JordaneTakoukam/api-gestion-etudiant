import express from "express";
import { ajouterAbsence, retirerAbsence } from "../controllers/abscences/absence.controller.js";
import { getAbsencesByUserAndFilter, getAbsencesWithEnseignantsByFilter, getAllAbsencesWithEnseignantsByFilter, getAllAbsencesWithEtudiantsByFilter, getAbsencesWithEtudiantsByFilter, getTotalHoursOfAbsenceByTeacher, getTotalHoursOfAbsenceByStudent } from "../controllers/abscences/get_absences.js";
import { signalerAbsence } from "../controllers/abscences/signaler_absence.controller.js";


// controllers

// middlewares

const router = express.Router();

router.get("/getAbsencesByUserAndFilter/:userId", getAbsencesByUserAndFilter);
router.get("/getAbsencesWithEnseignantsByFilter", getAbsencesWithEnseignantsByFilter);
router.get("/getAllAbsencesWithEnseignantsByFilter", getAllAbsencesWithEnseignantsByFilter);
router.get("/getAbsencesWithEtudiantsByFilter/:niveauId", getAbsencesWithEtudiantsByFilter);
router.get("/getAllAbsencesWithEtudiantsByFilter", getAllAbsencesWithEtudiantsByFilter);
router.get("/getTotalHoursOfAbsenceByTeacher", getTotalHoursOfAbsenceByTeacher);
router.get("/getTotalHoursOfAbsenceByStudent", getTotalHoursOfAbsenceByStudent);
router.post("/create/:userId", ajouterAbsence);
router.delete("/delete/:userId/:absenceId", retirerAbsence);


router.post("/signaler", signalerAbsence);


export default router;
