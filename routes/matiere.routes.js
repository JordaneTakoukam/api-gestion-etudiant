import express from "express";
import { createMatiere, readMatiere, readMatieres, updateMatiere, deleteMatiere } from "../controllers/matiere/matiere.controller.js";
import { createChapter, deleteChapter, readChapter, readChapters, updateChapter } from "../controllers/matiere/chapter/chapter.controller.js";

// controllers

// middlewares

const router = express.Router();


// create
router.post("/create", createMatiere);

//  read
router.get("/get/:id", readMatiere);
router.get("/get/:params", readMatieres);


// update
router.put("/update/:matiereId", updateMatiere);

// delete
router.delete("/delete/:matiereId", deleteMatiere);


// chapitre associer a une matieres
// create
router.post("/chapter/create", createChapter);

//  read
router.get("/chapter/get/:id", readChapter);
router.get("/chapter/get/:params", readChapters);


// update
router.put("/chapter/update/:id", updateChapter);

// delete
router.delete("/chapter/delete/:id", deleteChapter);



export default router;
