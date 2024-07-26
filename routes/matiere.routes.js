import express from "express";
import { createMatiere, readMatiere, readMatieres, updateMatiere, deleteMatiere, getMatieresByNiveau, getMatieresByNiveauWithPagination, getMatieresByEnseignantNiveau,generateProgressByNiveau, generateProgressByEnseignant, generateListMatByNiveau, generateListMatByEnseignantNiveau, searchMatiere, searchMatiereByEnseignant, createManyMatiere,updateMatiereTypeEns} from "../controllers/matiere/matiere.controller.js";
import { createChapitre, deleteChapitre, readChapitre, readChapitres, searchChapitre, updateChapitre, updateObjectifEtat,getChapitres, getProgressionGlobalEnseignants, getProgressionGlobalEnseignantsNiveau, getProgressionGlobalEnseignant, createManyChapitre, addStatut, updateStatutChap } from "../controllers/matiere/chapitre/chapitre.controller.js";
import { createObjectif, deleteObjectif, readObjectif, readObjectifs, searchObjectif, updateObjectif, updateObjectifEtatObj,getObjectifs,getProgressionMatiere, getProgressionGlobalEnseignantsObj, getProgressionGlobalEnseignantsNiveauObj, getProgressionGlobalEnseignantObj, createManyObjectif, updateLibelles, updateStatut} from "../controllers/matiere/objectif/objectif.controller.js";

// controllers

// middlewares

const router = express.Router();


// create
router.post("/create", createMatiere);
router.post("/createManyMatiere", createManyMatiere);
router.post("/updateMatiereTypeEns", updateMatiereTypeEns);

//  read
router.get("/get/:id", readMatiere);
router.get("/get/:params", readMatieres);
router.get("/getMatieresByNiveau/:niveauId", getMatieresByNiveau);
router.get("/searchMatiere/:langue/:searchString", searchMatiere);
router.get("/searchMatiereByEnseignant/:langue/:searchString", searchMatiereByEnseignant);
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
router.post("/chapitre/createManyChapitre", createManyChapitre);
router.put("/chapitre/addStatut", addStatut);
router.put("/chapitre/updateStatut/:chapitre", updateStatutChap);
router.get("/chapitre/searchChapitre/:langue/:searchString", searchChapitre);
router.get("/chapitre/getProgressionGlobalEnseignants", getProgressionGlobalEnseignants);
router.get("/chapitre/getProgressionGlobalEnseignantsNiveau/:niveauId", getProgressionGlobalEnseignantsNiveau);
router.get("/chapitre/getProgressionGlobalEnseignant/:enseignantId", getProgressionGlobalEnseignant);
router.get("/chapitre/getChapitres/:matiereId", getChapitres);


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
router.post("/objectif/createManyObjectif", createManyObjectif);
router.put("/objectif/updateLibelles", updateLibelles);
router.put("/objectif/updateStatut/:objectif", updateStatut);
router.get("/objectif/searchObjectif/:langue/:searchString", searchObjectif);
router.get("/objectif/getProgressionMatiere/:matiereId", getProgressionMatiere);
router.get("/objectif/getProgressionGlobalEnseignantsObj", getProgressionGlobalEnseignantsObj);
router.get("/objectif/getProgressionGlobalEnseignantsNiveau/:niveauId", getProgressionGlobalEnseignantsNiveauObj);
router.get("/objectif/getProgressionGlobalEnseignant/:enseignantId", getProgressionGlobalEnseignantObj);
router.get("/objectif/getObjectifs/:matiereId", getObjectifs);



//  read
router.get("/objectif/get/:id", readObjectif);
router.get("/objectif/get/:params", readObjectifs);



// update
router.put("/objectif/update/:objectifId", updateObjectif);

// delete
router.delete("/objectif/delete/:objectifId", deleteObjectif);
router.put("/objectif/update_etat/:objectifId", updateObjectifEtatObj);

export default router;
