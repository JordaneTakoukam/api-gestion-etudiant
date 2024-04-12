import express from "express";

// controllers
import { createDefaultSuperAdmin } from "../controllers/user/create/create_default_super_admin.controller.js";
import { deleteUser, updateUser } from "../controllers/user/update_and_delete.js";
import { createAdminController } from "../controllers/user/create/create_admin_controller.js";
import { createEtudiantController } from "../controllers/user/create/create_etudiant_controller.js";
import { createEnseignantController } from "../controllers/user/create/create_enseignant_controller.js";
import { getAllAdministrateurs, getAllEnseignants, getAllEtudiants, getUsersByRoleNomPrenom } from "../controllers/user/get/get_user_controller.js";

// middlewares

const router = express.Router();

// recuperer
// router.get("/get/:id", getUser);
// router.get("/get/:params", getUsers);
router.get("/getAdministrateurs", getAllAdministrateurs);
router.get("/getEnseignants", getAllEnseignants);
router.get("/getEtudiants", getAllEtudiants);
router.get("/getUsersByRoleNomPrenom/:role",getUsersByRoleNomPrenom);


// creer
router.post("/create/unique/super-admin", createDefaultSuperAdmin);
router.post("/create/create-admin", createAdminController);
router.post("/create/create-enseignant", createEnseignantController);
router.post("/create/create-etudiant", createEtudiantController);

//modifier
router.put("/update/:id", updateUser);

// supprimer
router.delete("/delete/:id", deleteUser);



export default router;
