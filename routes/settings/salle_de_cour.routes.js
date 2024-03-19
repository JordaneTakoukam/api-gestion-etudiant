import express from "express";

// controllers
import { createSalleDeCours, deleteSalleDeCours,  updateSalleDeCours } from "../../controllers/setting/salle_de_cour/salle_de_cour.controller.js";


// middlewares

const router = express.Router();

// create
router.post("/create", createSalleDeCours);



// update
router.put("/update/:salleDeCoursId", updateSalleDeCours);

// delete
router.delete("/delete/:salleDeCoursId", deleteSalleDeCours);



export default router;
