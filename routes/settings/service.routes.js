import express from "express";

// controllers
import { createService, deleteService, updateService } from "../../controllers/setting/service/service.controller.js";


// mserviceIddlewares

const router = express.Router();

// create
router.post("/create", createService);


// update
router.put("/update/:serviceId", updateService);

// delete
router.delete("/delete/:serviceId", deleteService);



export default router;
