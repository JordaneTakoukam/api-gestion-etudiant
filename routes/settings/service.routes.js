import express from "express";

// controllers
import { createService, deleteService, readServices, updateService } from "../../controllers/setting/service/service.controller.js";


// mserviceIddlewares

const router = express.Router();

// create
router.post("/create", createService);

//  read
router.get("", readServices);


// update
router.put("/update/:serviceId", updateService);

// delete
router.delete("/delete/:serviceId", deleteService);



export default router;
