import express from "express";

// controllers
import { createDefaultSuperAdmin } from "../controllers/user/create/create_default_super_admin.controller.js";
import { deleteUser, updateUser } from "../controllers/user/update_and_delete.js";
import { createAdminController } from "../controllers/user/create/create_admin_controller.js";
import { createEtudiant, updateEtudiant, getEtudiantsByLevelAndYear, getAllEtudiantsByLevelAndYear, getTotalEtudiantsByYear, getTotalEtudiantsByNiveau, getNbEtudiantsParSection, getNbAbsencesParSection, generateListEtudiant } from "../controllers/user/create/create_etudiant_controller.js";
import { createEnseignant, updateEnseignant, getEnseignantsByFilter, getAllEnseignantsByFilter, getEnseignantsByNomPrenom, getTotalEnseignants, getNiveauxByEnseignant, generateListEnseignant, searchEnseignant } from "../controllers/user/create/create_enseignant_controller.js";
import { getAllAdministrateurs, getAllEnseignants, getAllEtudiants, getCurrentUserData } from "../controllers/user/get/get_user_controller.js";
import { ajouterEtModifierImageProfil } from "../controllers/user/create/photo_profil/save_update_photo_profil.js";
import { deletePhotoProfil } from "../controllers/user/create/photo_profil/delete_photo_profil.js";

// middlewares

const router = express.Router();

// recuperer
// router.get("/get/:id", getUser);
// router.get("/get/:params", getUsers);
router.get("/getAdministrateurs", getAllAdministrateurs);
router.get("/getEnseignants", getAllEnseignants);
router.get("/getEtudiants", getAllEtudiants);
router.get("/getNbEtudiantsParSection", getNbEtudiantsParSection);
router.get("/getNbAbsencesParSection", getNbAbsencesParSection);
// router.get("/getUsersByRoleNomPrenom/:role",getUsersByRoleNomPrenom);
router.get("/getEtudiantsByLevelAndYear/:niveauId", getEtudiantsByLevelAndYear);
router.get("/getAllEtudiantsByLevelAndYear/:niveauId", getAllEtudiantsByLevelAndYear);
router.get("/generateListEtudiant/:annee", generateListEtudiant);

router.get("/getEnseignantsByFilter", getEnseignantsByFilter);
router.get("/searchEnseignant/:searchString", searchEnseignant);
router.get("/getAllEnseignantsByFilter", getAllEnseignantsByFilter);
router.get("/getEnseignantsByNomPrenom", getEnseignantsByNomPrenom);
router.get("/generateListEnseignant", generateListEnseignant);

router.get("/getTotalEtudiantsByYear", getTotalEtudiantsByYear);
router.get("/getTotalEtudiantsByNiveau", getTotalEtudiantsByNiveau);
router.get("/getTotalEnseignants", getTotalEnseignants);
router.get("/getNiveauxByEnseignant/:enseignantId", getNiveauxByEnseignant);

// creer
router.post("/create/unique/super-admin", createDefaultSuperAdmin);
router.post("/create/create-admin", createAdminController);
router.post("/create/create-enseignant", createEnseignant);
router.post("/create/create-etudiant", createEtudiant);

//modifier
router.put("/update/:id", updateUser);
router.put("/update/update-etudiant/:etudiantId", updateEtudiant);
router.put("/update/update-enseignant/:enseignantId", updateEnseignant);

// supprimer
router.delete("/delete/:id", deleteUser);
// router.delete("/delete/delete-etudiant/:etudiantId", deleteEtudiant);
// router.delete("/delete/delete-enseignant/:enseignantId", deleteEnseignant);


// photo profil
router.put("/save-photo-profile", ajouterEtModifierImageProfil);

router.delete("/delete-photo-profile", deletePhotoProfil);


router.get("/getCurrentUser", getCurrentUserData);





export default router;
