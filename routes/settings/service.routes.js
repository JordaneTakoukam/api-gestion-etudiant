import express from "express";

// controllers
import { createService, deleteService, readService, readServices, updateService } from "../../controllers/setting/service/service.controller.js";


// middlewares

const router = express.Router();

// create
router.post("/create", createService);

//  read
router.get("/get/:id", readService);
router.get("/get/:params", readServices);


// update
router.put("/update/:id", updateService);

// delete
router.delete("/delete/:id", deleteService);



export default router;
