import express from "express";

// controllers
import { createPeriodeEnseignement, deletePeriodeEnseignement, updatePeriodeEnseignement, getPeriodesEnseignement, getPeriodesEnseignementWithPagination, generateListPeriodeEnseignement, generateProgressionPeriodeEnseignement} from "../controllers/periodeEnseignement/periode_enseignement.controller.js";

// middlewares

const router = express.Router();


// create
router.post("/create", createPeriodeEnseignement);

// update
router.put("/update/:periodeEnseignementId", updatePeriodeEnseignement);

// delete
router.delete("/delete/:periodeEnseignementId", deletePeriodeEnseignement);

//  read
router.get("/getPeriodesEnseignementWithPagination/:niveauId", getPeriodesEnseignementWithPagination);

router.get("/getPeriodesEnseignement/:niveauId", getPeriodesEnseignement);
router.get("/generateListPeriodeEnseignement/:annee/:semestre", generateListPeriodeEnseignement);
router.get("/generateProgressionPeriodeEnseignement", generateProgressionPeriodeEnseignement);


export default router;
