import express from "express";

// controllers
import { readSemestreCourant, readSemestreCourants, createSemestreCourant, deleteSemestreCourant, updateSemestreCourant } from "../../controllers/setting/semestre/semestre.controller.js";


// middlewares

const router = express.Router();

// create
router.post("/createSemestreCourant", createSemestreCourant);

//  read
router.get("/get/:id", readSemestreCourant);
router.get("/get/:params", readSemestreCourants);
router.get("", readSemestreCourants);



// update
router.put("/update/:id", updateSemestreCourant);

// delete
router.delete("/delete/:id", deleteSemestreCourant);



export default router;
