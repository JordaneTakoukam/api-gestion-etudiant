import express from "express";

// controllers
import { createSection, deleteSection, readSection, readSections, updateSection } from "../../controllers/setting/section/section.controller.js";


// middlewares

const router = express.Router();

// create
router.post("/create", createSection);

//  read
router.get("/get/:id", readSection);
router.get("/get/:params", readSections);


// update
router.put("/update/:id", updateSection);

// delete
router.delete("/delete/:id", deleteSection);



export default router;
