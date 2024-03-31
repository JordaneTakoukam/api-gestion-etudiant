import express from "express";

// controllers
import { readAnneeCourante, readAnneeCourantes, createAnneeCourante, createPremiereAnnee, deleteAnneeCourante, updateAnneeCourante } from "../../controllers/setting/annee/annee.controller.js";


// middlewares

const router = express.Router();

// create
router.post("/createAnneeCourante", createAnneeCourante);
router.post("/createPremiereAnnee", createPremiereAnnee);

//  read
router.get("/get/:id", readAnneeCourante);
router.get("/get/:params", readAnneeCourantes);
router.get("", readAnneeCourantes);



// update
router.put("/update/:id", updateAnneeCourante);

// delete
router.delete("/delete/:id", deleteAnneeCourante);



export default router;
