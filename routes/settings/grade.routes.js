import express from "express";

// controllers
import { createGrade, deleteGrade, readGrade, readGrades, updateGrade } from "../../controllers/setting/grade/grade.controller.js";


// middlewares

const router = express.Router();

// create
router.post("/create", createGrade);

//  read
router.get("/get/:id", readGrade);
router.get("/get/:params", readGrades);


// update
router.put("/update/:id", updateGrade);

// delete
router.delete("/delete/:id", deleteGrade);



export default router;
