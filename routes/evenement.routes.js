import express from "express";

// controllers
import { createEvenement, deleteEvenement, readEvenement, readEvenements, updateEvenement, getEvenementsByYear, getUpcommingEventsOfYear } from "../controllers/evenement/evenement.controller.js";

// middlewares

const router = express.Router();


// create
router.post("/create", createEvenement);

//  read
router.get("/get/:id", readEvenement);
router.get("/get/:params", readEvenements);
router.get("/getByYearByPage/:annee", getEvenementsByYear);
router.get("/getFirstTenEventsOfYear/:annee", getUpcommingEventsOfYear)


// update
router.put("/update/:evenementId", updateEvenement);

// delete
router.delete("/delete/:evenementId", deleteEvenement);



export default router;
