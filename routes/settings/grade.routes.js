import express from "express";

// controllers
import { createGrade, deleteGrade, updateGrade } from "../../controllers/setting/grade/grade.controller.js";


// middlewares

const router = express.Router();

// create
router.post("/create", createGrade);


// update
router.put("/update/:id", updateGrade);

// delete
router.delete("/delete/:id", deleteGrade);



export default router;
