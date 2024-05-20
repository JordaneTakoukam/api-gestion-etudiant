import express from "express";

// controllers
import { createAnneeCourante, createPremiereAnnee, deleteAnneeCourante, updateAnneeCourante } from "../../controllers/setting/annee/annee.controller.js";


// middlewares

const router = express.Router();

// create
router.post("/createAnneeCourante", createAnneeCourante);
router.post("/createPremiereAnnee", createPremiereAnnee);
router.put("/updateAnneeCourante", updateAnneeCourante);


// delete
router.delete("/delete/:id", deleteAnneeCourante);



export default router;
