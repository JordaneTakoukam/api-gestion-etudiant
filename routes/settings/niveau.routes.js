import express from "express";

// controllers
import { createNiveau, deleteNiveau, readNiveau, readNiveaus, updateNiveau } from "../../controllers/setting/niveau/niveau.controller.js";


// middlewares

const router = express.Router();

// create
router.post("/create", createNiveau);

//  read
router.get("/get/:id", readNiveau);
router.get("/get/:params", readNiveaus);


// update
router.put("/update/:id", updateNiveau);

// delete
router.delete("/delete/:id", deleteNiveau);



export default router;
