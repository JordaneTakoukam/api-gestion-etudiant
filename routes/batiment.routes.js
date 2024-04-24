import express from "express";

import { createBatiment } from "../controllers/batiment/create_batiment.controller.js";
import { updateBatiment } from "../controllers/batiment/update_batiment.controller.js";
import { deleteBatiment } from "../controllers/batiment/delete_batiment.controller.js";
import { getAllBatiment, getBatimentById } from "../controllers/batiment/get_batiment.controller.js";

//controller 

// middlewares

const router = express.Router();

// recuperer
router.get("/getAll", getAllBatiment);


router.get("/getById/:batimentId", getBatimentById);

// creer
router.post("/create", createBatiment);

//modifier
router.put("/update/:batimentId", updateBatiment);

// supprimer
router.delete("/delete/:batimentId", deleteBatiment);




export default router;
