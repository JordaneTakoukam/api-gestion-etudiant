import express from "express";

// controllers
import { createSchedule, deleteSchedule, readSchedule, readSchedules, updateSchedule } from "../controllers/schedule/schedule.controller.js";

// middlewares

const router = express.Router();


// create
router.post("/create", createSchedule);

//  read
router.get("/get/:id", readSchedule);
router.get("/get/:params", readSchedules);


// update
router.put("/update/:id", updateSchedule);

// delete
router.delete("/delete/:id", deleteSchedule);



export default router;
