import express from "express";

// controllers
import {createTauxHoraire, deleteTauxHoraire, updateTauxHoraire } from "../../controllers/setting/taux_horaire/taux_horaire.controller.js";


// middlewares

const router = express.Router();

// create
router.post("/createTauxHoraire", createTauxHoraire);
router.put("/updateTauxHoraire", updateTauxHoraire);

// delete
router.delete("/delete/:id", deleteTauxHoraire);



export default router;
