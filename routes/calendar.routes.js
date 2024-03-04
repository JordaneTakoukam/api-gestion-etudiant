import express from "express";

// controllers
import { createCalendar, deleteCalendar, readCalendar, readCalendars, updateCalendar } from "../controllers/calendar/calendar.controller.js";

// middlewares

const router = express.Router();


// create
router.post("/create", createCalendar);

//  read
router.get("/get/:id", readCalendar);
router.get("/get/:params", readCalendars);


// update
router.put("/update/:id", updateCalendar);

// delete
router.delete("/delete/:id", deleteCalendar);



export default router;
