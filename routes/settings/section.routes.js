import express from "express";

// controllers
import {createSection, deleteSection, updateSection } from "../../controllers/setting/section/section.controller.js";


// middlewares

const router = express.Router();

// create
router.post("/create", createSection);

//  read
// router.get("/get/:id", readSection);
// router.get("/get/:params", readSections);
// router.get("", readSections);



// update
router.put("/update/:sectionId", updateSection);

// delete
router.delete("/delete/:sectionId", deleteSection);



export default router;
