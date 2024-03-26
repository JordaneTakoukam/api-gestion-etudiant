import express from "express";

// controllers
import { readTypeEnseignement, readTypeEnseignements, createTypeEnseignement, deleteTypeEnseignement, updateTypeEnseignement } from "../../controllers/setting/type_enseignement/type_enseignement.controller.js";


// middlewares

const router = express.Router();

// create
router.post("/create", createTypeEnseignement);

//  read
router.get("/get/:id", readTypeEnseignement);
router.get("/get/:params", readTypeEnseignements);
router.get("", readTypeEnseignements);



// update
router.put("/update/:id", updateTypeEnseignement);

// delete
router.delete("/delete/:id", deleteTypeEnseignement);



export default router;
