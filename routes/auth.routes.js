import express from "express";
import { createDefaultSuperAdmin } from "../controllers/auth/create_default_super_admin.controller.js";
import { signup } from "../controllers/auth/signup.controller.js";
import { signin } from "../controllers/auth/signin.controller.js";
import { verifyCodeAndSignIn } from "../controllers/auth/verify_code.controller.js";

// controllers

// middlewares

const router = express.Router();


router.post("/create/super-admin", createDefaultSuperAdmin);
router.post("/signup", signup);
router.put("/signup/verify-code", verifyCodeAndSignIn);
router.post("/signin", signin);
// router.post("/password/change", resetPassword); 




export default router;
