import express from "express";
import { createPresence, deletePresence, generateListPresenceByNiveau, getPresencesWithTotalHoraire, searchEnseignantPresence, updatePresence } from "../controllers/presences/presence.controller.js";

// controllers

// middlewares

const router = express.Router();


// create
router.post("/create", createPresence);

//  read
router.get("/getPresencesWithTotalHoraire/:niveauId", getPresencesWithTotalHoraire);
router.get("/generateListPresenceByNiveau/:niveauId", generateListPresenceByNiveau);
router.get("/searchEnseignantPresence",searchEnseignantPresence);


// update
router.put("/update/:periodeId", updatePresence);

// delete
router.delete("/delete/:periodeId", deletePresence);



export default router;
