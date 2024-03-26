import express from "express";

// controllers
import { readRole, readRoles, createRole, deleteRole, updateRole } from "../../controllers/setting/role/role.controller.js";


// middlewares

const router = express.Router();

// create
router.post("/create", createRole);

//  read
router.get("/get/:id", readRole);
router.get("/get/:params", readRoles);
router.get("", readRoles);



// update
router.put("/update/:id", updateRole);

// delete
router.delete("/delete/:id", deleteRole);



export default router;
