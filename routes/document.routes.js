import express from "express";

// controllers
import { deleteDoc, downloadDoc, getDocuments, uploadDoc} from "../controllers/documents/document.controller.js";

// middlewares
const router = express.Router();

router.post("/upload", uploadDoc);
router.get("/getDocuments", getDocuments);
router.get("/download/:id/:lang", downloadDoc);
router.delete("/delete/:id", deleteDoc);

export default router;