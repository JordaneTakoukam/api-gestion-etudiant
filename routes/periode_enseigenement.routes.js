import express from "express";

// controllers
import { createPeriodeEnseignement, deletePeriodeEnseignement, updatePeriodeEnseignement, getPeriodesEnseignement, getPeriodesEnseignementWithPagination} from "../controllers/periodeEnseignement/periode_enseignement.controller.js";

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


export default router;
