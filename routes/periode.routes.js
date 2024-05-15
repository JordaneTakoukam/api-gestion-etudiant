import express from "express";

// controllers
import { createPeriode, deletePeriode, readPeriode, readPeriodes, updatePeriode, getPeriodesByNiveau, getPeriodesAVenirByNiveau, getPeriodesAVenirByEnseignant, generateEmploisDuTemps} from "../controllers/periode/periode.controller.js";

// middlewares

const router = express.Router();


// create
router.post("/create", createPeriode);

//  read
router.get("/get/:id", readPeriode);
router.get("/get/:params", readPeriode);
router.get("/getPeriodesByNiveau/:niveauId", getPeriodesByNiveau);
router.get("/generateEmploisDuTemps/:niveauId", generateEmploisDuTemps);
router.get("/getPeriodesAVenirByNiveau/:niveauId", getPeriodesAVenirByNiveau);
router.get("/getPeriodesAVenirByEnseignant/:enseignantId", getPeriodesAVenirByEnseignant);


// update
router.put("/update/:periodeId", updatePeriode);

// delete
router.delete("/delete/:periodeId", deletePeriode);



export default router;
