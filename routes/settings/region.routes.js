import express from "express";

// controllers
import { createRegion, deleteRegion, updateRegion } from "../../controllers/setting/region/region.controller.js";


// middlewares

const router = express.Router();

// create
router.post("/create", createRegion);



// update
router.put("/update/:regionId", updateRegion);

// delete
router.delete("/delete/:regionId", deleteRegion);



export default router;
