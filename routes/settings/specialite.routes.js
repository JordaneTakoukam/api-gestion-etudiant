import express from "express";

// controllers
import { createSpecialite, deleteSpecialite, updateSpecialite } from "../../controllers/setting/specialite/specialite.controller.js";


// mspecialiteIddlewares

const router = express.Router();

// create
router.post("/create", createSpecialite);


// update
router.put("/update/:specialiteId", updateSpecialite);

// delete
router.delete("/delete/:specialiteId", deleteSpecialite);



export default router;
