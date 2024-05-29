import express from "express";

// controllers
import { readEtatsEvenement, readEtatsEvenements, createEtatsEvenement, deleteEtatsEvenement, updateEtatsEvenement } from "../../controllers/setting/etat_evenement/etat_evenement.controller.js";


// middlewares

const router = express.Router();

// create
router.post("/create", createEtatsEvenement);

//  read
router.get("/get/:id", readEtatsEvenement);
router.get("/get/:params", readEtatsEvenements);
router.get("", readEtatsEvenements);



// update
router.put("/update/:id", updateEtatsEvenement);

// delete
router.delete("/delete/:id", deleteEtatsEvenement);



export default router;
