import express from "express";

// controllers
import { createSalleDeCour, deleteSalleDeCour, readSalleDeCour, readSalleDeCours, updateSalleDeCour } from "../../controllers/setting/salle_de_cour/salle_de_cour.controller.js";


// middlewares

const router = express.Router();

// create
router.post("/create", createSalleDeCour);

//  read
router.get("/get/:id", readSalleDeCour);
router.get("/get/:params", readSalleDeCours);


// update
router.put("/update/:id", updateSalleDeCour);

// delete
router.delete("/delete/:id", deleteSalleDeCour);



export default router;
