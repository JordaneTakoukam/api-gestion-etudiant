import express from "express";

// controllers
import { createCommune, deleteCommune, readCommune, readCommunes, updateCommune } from "../../controllers/setting/commune/commune.controller.js";


// middlewares

const router = express.Router();

// create
router.post("/create", createCommune);

//  read
router.get("/get/:id", readCommune);
router.get("/get/:params", readCommunes);


// update
router.put("/update/:id", updateCommune);

// delete
router.delete("/delete/:id", deleteCommune);



export default router;
