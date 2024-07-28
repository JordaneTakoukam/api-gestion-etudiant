import express from "express";

// controllers
import { deleteDoc, downloadDoc, downloadPiecesJointes, getDocuments, uploadDoc} from "../controllers/documents/document.controller.js";

// middlewares
const router = express.Router();

router.post("/upload", uploadDoc);
router.get("/getDocuments", getDocuments);
router.get("/download/:id", downloadDoc);
router.delete("/delete/:id", deleteDoc);
router.get("/download-pieces-jointes", downloadPiecesJointes);

export default router;