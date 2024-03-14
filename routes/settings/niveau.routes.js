import express from "express";

// controllers
import { createNiveau, deleteNiveau, updateNiveau } from "../../controllers/setting/niveau/niveau.controller.js";


// middlewares

const router = express.Router();

// create
router.post("/create", createNiveau);




// update
router.put("/update/:id", updateNiveau);

// delete
router.delete("/delete/:id", deleteNiveau);



export default router;
