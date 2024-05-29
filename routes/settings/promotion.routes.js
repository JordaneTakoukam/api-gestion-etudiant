import express from "express";

// controllers
import { createPromotion, deletePromotion, updatePromotion } from "../../controllers/setting/promotion/promotion.controller.js";


// middlewares

const router = express.Router();

// create
router.post("/create", createPromotion);



// update
router.put("/update/:promotionId", updatePromotion);

// delete
router.delete("/delete/:promotionId", deletePromotion);



export default router;
