import express from "express";
import { ajouterAlerte, recupererAlertesParUser, supprimerAlerte } from "../controllers/alerte/alerte.controller.js";

// controllers

// middlewares

const router = express.Router();


router.get("/getByUser", recupererAlertesParUser);
router.post("/create", ajouterAlerte);
router.delete("/delete/:alerteId", supprimerAlerte);



export default router;
