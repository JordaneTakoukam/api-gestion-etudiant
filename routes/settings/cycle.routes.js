import express from "express";

// controllers
import { createCycle, deleteCycle, readCycle, readCycles, updateCycle } from "../../controllers/setting/cycle/cycle.controller.js";


// middlewares

const router = express.Router();

// create
router.post("/create", createCycle);

//  read
router.get("/get/:id", readCycle);
router.get("/get/:params", readCycles);


// update
router.put("/update/:id", updateCycle);

// delete
router.delete("/delete/:id", deleteCycle);



export default router;
