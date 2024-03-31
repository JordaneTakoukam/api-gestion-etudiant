import express from "express";

// controllers
import { readStatutEvenement, readStatutEvenements, createStatutEvenement, deleteStatutEvenement, updateStatutEvenement } from "../../controllers/setting/etat_evenement/etat_evenement.controller.js";


// middlewares

const router = express.Router();

// create
router.post("/create", createStatutEvenement);

//  read
router.get("/get/:id", readStatutEvenement);
router.get("/get/:params", readStatutEvenements);
router.get("", readStatutEvenements);



// update
router.put("/update/:id", updateStatutEvenement);

// delete
router.delete("/delete/:id", deleteStatutEvenement);



export default router;
