import express from "express";

// controllers
import { createCycle, deleteCycle,  updateCycle } from "../../controllers/setting/cycle/cycle.controller.js";


// middlewares

const router = express.Router();

// create
router.post("/create", createCycle);


// update
router.put("/update/:cycleId", updateCycle);

// delete
router.delete("/delete/:cycleId", deleteCycle);



export default router;
