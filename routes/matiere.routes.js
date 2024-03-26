import express from "express";
import { createMatiere, readMatiere, readMatieres, updateMatiere, deleteMatiere, getMatieresByNiveau, getMatieresByNiveauWithPagination} from "../controllers/matiere/matiere.controller.js";
import { createChapitre, deleteChapitre, readChapitre, readChapitres, updateChapitre, updateObjectifEtat } from "../controllers/matiere/chapitre/chapitre.controller.js";

// controllers

// middlewares

const router = express.Router();


// create
router.post("/create", createMatiere);

//  read
router.get("/get/:id", readMatiere);
router.get("/get/:params", readMatieres);
router.get("/getMatieresByNiveau/:niveauId", getMatieresByNiveau);
router.get("/getMatieresByNiveauWithPagination/:niveauId", getMatieresByNiveauWithPagination);


// update
router.put("/update/:matiereId", updateMatiere);

// delete
router.delete("/delete/:matiereId", deleteMatiere);


// chapitre associer a une matieres
// create
router.post("/chapitre/create", createChapitre);

//  read
router.get("/chapitre/get/:id", readChapitre);
router.get("/chapitre/get/:params", readChapitres);



// update
router.put("/chapitre/update/:chapitreId", updateChapitre);

// delete
router.delete("/chapitre/delete/:chapitreId", deleteChapitre);
router.put("/chapitre/update_etat/:chapitreId", updateObjectifEtat);


export default router;
