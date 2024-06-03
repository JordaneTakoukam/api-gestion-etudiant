import express from "express";
import { ajouterAbsence, retirerAbsence, justifierAbsence } from "../controllers/abscences/absence.controller.js";
import { getAbsencesByUserAndFilter, getAbsencesWithEnseignantsByFilter, getAllAbsencesWithEnseignantsByFilter, getAllAbsencesWithEtudiantsByFilter, getAbsencesWithEtudiantsByFilter, getTotalHoursOfAbsenceByTeacher, getTotalHoursOfAbsenceByStudent, generateListAbsenceEtudiant, generateListAbsenceEnseignant } from "../controllers/abscences/get_absences.js";
import { signalerAbsence, getAbsencesSignaler, getUserNotifications, markNotificationAsRead } from "../controllers/abscences/signaler_absence.controller.js";


// controllers

// middlewares

const router = express.Router();
router.get('/notifications/:userId', getUserNotifications);
router.post('/notifications/markAsRead', markNotificationAsRead);
router.get("/getAbsencesByUserAndFilter/:userId", getAbsencesByUserAndFilter);
router.get("/getAbsencesWithEnseignantsByFilter", getAbsencesWithEnseignantsByFilter);
router.get("/getAllAbsencesWithEnseignantsByFilter", getAllAbsencesWithEnseignantsByFilter);
router.get("/generateListAbsenceEnseignant", generateListAbsenceEnseignant);
router.get("/getAbsencesWithEtudiantsByFilter/:niveauId", getAbsencesWithEtudiantsByFilter);
router.get("/getAllAbsencesWithEtudiantsByFilter/:niveauId", getAllAbsencesWithEtudiantsByFilter);
router.get("/generateListAbsenceEtudiant/:annee/:semestre", generateListAbsenceEtudiant);
router.get("/getTotalHoursOfAbsenceByTeacher", getTotalHoursOfAbsenceByTeacher);
router.get("/getTotalHoursOfAbsenceByStudent", getTotalHoursOfAbsenceByStudent);
router.post("/create/:userId", ajouterAbsence);
router.delete("/delete/:userId/:absenceId", retirerAbsence);
router.put("/update", justifierAbsence);


router.post("/signaler", signalerAbsence);
router.get("/getAbsencesSignaler/:userId", getAbsencesSignaler);


export default router;
