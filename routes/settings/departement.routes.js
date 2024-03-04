import express from "express";

// controllers
import { createDepartement, deleteDepartement, readDepartement, readDepartements, updateDepartement } from "../../controllers/setting/departement/departement.controller.js";


// middlewares

const router = express.Router();

// create
router.post("/create", createDepartement);

//  read
router.get("/get/:id", readDepartement);
router.get("/get/:params", readDepartements);


// update
router.put("/update/:id", updateDepartement);

// delete
router.delete("/delete/:id", deleteDepartement);



export default router;
