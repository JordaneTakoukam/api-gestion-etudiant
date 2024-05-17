import express from "express";

// controllers
import {createCategorie, deleteCategorie, updateCategorie } from "../../controllers/setting/categorie/categorie.controller.js";


// middlewares

const router = express.Router();

// create
router.post("/create", createCategorie);

//  read
// router.get("/get/:id", readCategorie);
// router.get("/get/:params", readCategories);
// router.get("", readCategories);


// update
router.put("/update/:id", updateCategorie);

// delete
router.delete("/delete/:id", deleteCategorie);



export default router;
