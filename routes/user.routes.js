import express from "express";

// controllers
import { createDefaultSuperAdmin } from "../controllers/auth/create_default_super_admin.controller.js";
import { createUser } from "../controllers/user/create/create_user.controller.js";
import { deleteUsers, getUser, getUsers, updateUser, updatePassword } from "../controllers/user/account.controller.js";

// middlewares

const router = express.Router();

// recuperer
router.get("/get/:id", getUser);
router.get("/get/:params", getUsers);

// creer
router.post("/create/unique/super-admin", createDefaultSuperAdmin);
router.post("/create", createUser);

//modifier
router.put("/update/:id", updateUser);
router.put("/update/password", updatePassword);

// supprimer
router.delete("/delete/:id", deleteUsers);




export default router;
