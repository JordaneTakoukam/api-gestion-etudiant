import express from "express";

// controllers
import { createDepartement, deleteDepartement, updateDepartement } from "../../controllers/setting/departement/departement.controller.js";


// middlewares

const router = express.Router();

// create
router.post("/create", createDepartement);




// update
router.put("/update/:departementId", updateDepartement);

// delete
router.delete("/delete/:departementId", deleteDepartement);



export default router;
