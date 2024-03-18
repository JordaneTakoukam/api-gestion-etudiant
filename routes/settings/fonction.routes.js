import express from "express";

// controllers
import { readFonction, readFonctions, createFonction, deleteFonction, updateFonction } from "../../controllers/setting/fonction/fonction.controller.js";


// middlewares

const router = express.Router();

// create
router.post("/create", createFonction);

//  read
router.get("/get/:id", readFonction);
router.get("/get/:params", readFonctions);
router.get("", readFonctions);

//

// update
router.put("/update/:id", updateFonction);

// delete
router.delete("/delete/:id", deleteFonction);



export default router;
