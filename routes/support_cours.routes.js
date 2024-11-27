import express from "express";
import { createSupport, deleteSupport, downloadSupport, getSupportsByFilters, searchSupports, updateSupport } from "../controllers/supportCours/support_cours.controller.js";

// controllers

// middlewares

const router = express.Router();


// create
router.post("/create", createSupport);

// update
router.put("/update/:id", updateSupport);

// delete
router.delete("/delete/:id", deleteSupport);

//  read
router.get("/getSupportsByFilters", getSupportsByFilters);
router.get("/searchSupports", searchSupports);
router.get("/downloadSupport/:id",downloadSupport);


export default router;
