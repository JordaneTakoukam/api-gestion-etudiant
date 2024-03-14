import express from "express";

// controllers
import { createFonction, deleteFonction, updateFonction } from "../../controllers/setting/fonction/fonction.controller.js";


// middlewares

const router = express.Router();

// create
router.post("/create", createFonction);

//

// update
router.put("/update/:id", updateFonction);

// delete
router.delete("/delete/:id", deleteFonction);



export default router;
