import express from "express";

// controllers
import { createRegion, deleteRegion, readRegion, readRegions, updateRegion } from "../../controllers/setting/region/region.controller.js";


// middlewares

const router = express.Router();

// create
router.post("/create", createRegion);

//  read
router.get("/get/:id", readRegion);
router.get("/get/:params", readRegions);


// update
router.put("/update/:id", updateRegion);

// delete
router.delete("/delete/:id", deleteRegion);



export default router;
