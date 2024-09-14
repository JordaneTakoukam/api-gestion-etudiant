import express from "express";

// controllers
import { generateQrCode} from "../controllers/qr_code/qr_code_controller.js";

// middlewares
const router = express.Router();

// create
router.post("/generate-qr", generateQrCode);

export default router;