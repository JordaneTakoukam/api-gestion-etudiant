import express from "express";
import { createPresence, deletePresence, getPresencesWithTotalHoraire, updatePresence } from "../controllers/presences/presence.controller.js";

// controllers

// middlewares

const router = express.Router();


// create
router.post("/create", createPresence);

//  read
router.get("/getPresencesWithTotalHoraire/:niveauId", getPresencesWithTotalHoraire);


// update
router.put("/update/:periodeId", updatePresence);

// delete
router.delete("/delete/:periodeId", deletePresence);



export default router;
