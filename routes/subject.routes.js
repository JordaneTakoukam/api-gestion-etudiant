import express from "express";
import { createSubject, readSubject, readSubjects, updateSubject, deleteSubject } from "../controllers/subject/subject.controller.js";
import { createChapter, deleteChapter, readChapter, readChapters, updateChapter } from "../controllers/subject/chapter/chapter.controller.js";

// controllers

// middlewares

const router = express.Router();


// create
router.post("/create", createSubject);

//  read
router.get("/get/:id", readSubject);
router.get("/get/:params", readSubjects);


// update
router.put("/update/:id", updateSubject);

// delete
router.delete("/delete/:id", deleteSubject);


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
