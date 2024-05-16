import express from "express";

// controllers
import { readDepartement, readDepartements, createDepartement, deleteDepartement, updateDepartement } from "../../controllers/setting/departement_academique/departement_academique_controller.js";


// middlewares

const router = express.Router();

// create
router.post("/create", createDepartement);

//  read
router.get("/get/:id", readDepartement);
router.get("/get/:params", readDepartements);
router.get("", readDepartements);



// update
router.put("/update/:id", updateDepartement);

// delete
router.delete("/delete/:id", deleteDepartement);



export default router;
