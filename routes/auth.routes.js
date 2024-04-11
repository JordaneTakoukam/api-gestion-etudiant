import express from "express";

// controllers
import { signin } from "../controllers/auth/signin.controller.js";
import { NewJWT } from "../controllers/auth/new-jwt.js";
import { sendVerificationCodeByEmail, updatePassword, verifyVerificationCode } from "../controllers/auth/reset_password.controller.js";

// middlewares

const router = express.Router();


router.post("/signin", signin); // connexion
router.post("/signin/re-jwt", NewJWT); // connexion


router.put("/password/verification/send", sendVerificationCodeByEmail);
router.get("/password/verification/verify", verifyVerificationCode);
router.put("/password/update", updatePassword);



export default router;
