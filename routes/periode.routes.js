import express from "express";

// controllers
import { createPeriode, deletePeriode, readPeriode, readPeriodes, updatePeriode, getPeriodesByNiveau, getPeriodesAVenirByNiveau} from "../controllers/periode/periode.controller.js";

// middlewares

const router = express.Router();


// create
router.post("/create", createPeriode);

//  read
router.get("/get/:id", readPeriode);
router.get("/get/:params", readPeriode);
router.get("/getPeriodesByNiveau/:niveauId", getPeriodesByNiveau);
router.get("/getPeriodesAVenirByNiveau/:niveauId", getPeriodesAVenirByNiveau)


// update
router.put("/update/:periodeId", updatePeriode);

// delete
router.delete("/delete/:periodeId", deletePeriode);



export default router;
