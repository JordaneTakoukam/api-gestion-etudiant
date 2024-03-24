import express from "express";

// controllers
import { changePassword, resetPassword, signin } from "../controllers/auth/auth.controller.js";
import { NewJWT } from "../controllers/auth/new-jwt.js";

// middlewares

const router = express.Router();


router.post("/signin", signin); // connexion
router.post("/signin/re-jwt", NewJWT); // connexion
router.post("/password/change", changePassword); // changer le mot de passe
router.post("/password/reset", resetPassword); // reinitialiser le mot de passe




export default router;
