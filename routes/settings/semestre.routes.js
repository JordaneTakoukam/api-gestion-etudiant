import express from "express";

// controllers
import {createSemestreCourant, deleteSemestreCourant, updateSemestreCourant } from "../../controllers/setting/semestre/semestre.controller.js";


// middlewares

const router = express.Router();

// create
router.post("/createSemestreCourant", createSemestreCourant);
router.put("/updateSemestreCourant", updateSemestreCourant);

// delete
router.delete("/delete/:id", deleteSemestreCourant);



export default router;
