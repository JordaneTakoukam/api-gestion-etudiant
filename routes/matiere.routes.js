import express from "express";
import { createMatiere, readMatiere, readMatieres, updateMatiere, deleteMatiere, getMatieresByNiveau, getMatieresByNiveauWithPagination, getMatieresByEnseignantNiveau,generateProgressByNiveau, generateProgressByEnseignant, generateListMatByNiveau, generateListMatByEnseignantNiveau} from "../controllers/matiere/matiere.controller.js";
import { createChapitre, deleteChapitre, readChapitre, readChapitres, updateChapitre, updateObjectifEtat,getChapitres, getProgressionGlobalEnseignants, getProgressionGlobalEnseignantsNiveau, getProgressionGlobalEnseignant } from "../controllers/matiere/chapitre/chapitre.controller.js";
import { createObjectif, deleteObjectif, readObjectif, readObjectifs, updateObjectif, updateObjectifEtatObj,getObjectifs, getProgressionGlobalEnseignantsObj, getProgressionGlobalEnseignantsNiveauObj, getProgressionGlobalEnseignantObj } from "../controllers/matiere/objectif/objectif.controller.js";

// controllers

// middlewares

const router = express.Router();


// create
router.post("/create", createMatiere);

//  read
router.get("/get/:id", readMatiere);
router.get("/get/:params", readMatieres);
router.get("/getMatieresByNiveau/:niveauId", getMatieresByNiveau);
router.get("/generateListMatByNiveau/:annee/:semestre", generateListMatByNiveau);
router.get("/generateProgressByNiveau/:annee/:semestre", generateProgressByNiveau);
router.get("/getMatieresByNiveauWithPagination/:niveauId", getMatieresByNiveauWithPagination);
router.get("/getMatieresByEnseignantNiveau/:niveauId", getMatieresByEnseignantNiveau);
router.get("/generateListMatByEnseignantNiveau/:niveauId", generateListMatByEnseignantNiveau);
router.get("/generateProgressByEnseignant/:niveauId", generateProgressByEnseignant);


// update
router.put("/update/:matiereId", updateMatiere);

// delete
router.delete("/delete/:matiereId", deleteMatiere);


// chapitre associer a une matieres
// create
router.post("/chapitre/create", createChapitre);
router.get("/chapitre/getProgressionGlobalEnseignants", getProgressionGlobalEnseignants);
router.get("/chapitre/getProgressionGlobalEnseignantsNiveau/:niveauId", getProgressionGlobalEnseignantsNiveau);
router.get("/chapitre/getProgressionGlobalEnseignant/:enseignantId", getProgressionGlobalEnseignant);
router.get("/chapitre/getChapitres", getChapitres);


//  read
router.get("/chapitre/get/:id", readChapitre);
router.get("/chapitre/get/:params", readChapitres);



// update
router.put("/chapitre/update/:chapitreId", updateChapitre);

// delete
router.delete("/chapitre/delete/:chapitreId", deleteChapitre);
router.put("/chapitre/update_etat/:chapitreId", updateObjectifEtat);

// objectif associer a une matiere
// create
router.post("/objectif/create", createObjectif);
router.get("/objectif/getProgressionGlobalEnseignants", getProgressionGlobalEnseignantsObj);
router.get("/objectif/getProgressionGlobalEnseignantsNiveau/:niveauId", getProgressionGlobalEnseignantsNiveauObj);
router.get("/objectif/getProgressionGlobalEnseignant/:enseignantId", getProgressionGlobalEnseignantObj);
router.get("/objectif/getObjectifs", getObjectifs);


//  read
router.get("/objectif/get/:id", readObjectif);
router.get("/objectif/get/:params", readObjectifs);



// update
router.put("/objectif/update/:objectifId", updateObjectif);

// delete
router.delete("/objectif/delete/:objectifId", deleteObjectif);
router.put("/objectif/update_etat/:objectifId", updateObjectifEtatObj);

export default router;
