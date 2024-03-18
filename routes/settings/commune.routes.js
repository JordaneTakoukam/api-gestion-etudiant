import express from "express";

// controllers
import { createCommune, deleteCommune,  updateCommune } from "../../controllers/setting/commune/commune.controller.js";


// middlewares

const router = express.Router();

// create
router.post("/create", createCommune);


// update
router.put("/update/:communeId", updateCommune);

// delete
router.delete("/delete/:communeId", deleteCommune);



export default router;
