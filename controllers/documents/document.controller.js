import mongoose from 'mongoose';
import Document from '../../models/document.model.js'
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { DateTime } from 'luxon';
import { message } from '../../configs/message.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename); 
export const uploadDoc = async (req, res) => {
    
    const  {nomFr, nomEn}  = req.query;
    
    if (!nomFr || !nomEn) {
        return res.status(400).json({ success: false, message: message.champ_obligatoire});
    }

    const dateCreation = DateTime.fromMillis(Date.now());

    const storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, './public/documents/documents_upload/');
        },
        filename: function (req, file, cb) {
            const extension = path.extname(file.originalname);
            const timestamp = dateCreation.toFormat('X');
            const fileName = `${timestamp}${extension}`;
            cb(null, fileName);
        }
    });

    const upload = multer({ storage }).single('file');
    
    upload(req, res, async (err) => {
        if (err) {
            return res.status(500).json({ success: false, message: { fr: "Une erreur s'est produite lors du téléchargement du document.", en: "An error occurred during document upload." } });
        }
        
        if (!req.file || !req.file.filename) {
            return res.status(400).json({ success: false, message: { fr: "Le document n'a pas été ajouté.", en: "Document was not added." } });
        }

        const file_path = `/private/documents/documents_upload/${req.file.filename}`;
        const newDocument = new Document({
            nomFr,
            nomEn,
            date_creation: dateCreation.toJSDate(),
            file_path
        });

        try {
            const savedDocument = await newDocument.save();
            res.status(200).json({
                success: true,
                data: savedDocument,
                message: { fr: "Le document a été ajouté avec succès.", en: "Document has been successfully added." }
            });
        } catch (error) {
            console.error("Erreur lors de l'enregistrement du document :", error);
            res.status(500).json({ success: false, message: { fr: "Une erreur s'est produite lors de l'enregistrement du document.", en: "An error occurred while saving the document." } });
        }
    });
};

export const getDocuments = async (req, res) => {
    try {
        const documents = await Document.find({});
        res.status(200).json(documents);
      } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la récupération des documents', error });
      }
}

export const downloadDoc = async (req, res) => {
    try {
        const {id, lang}=req.params;
        const document = await Document.findById(id);
        if (!document) {
          return res.status(404).json({ message: 'Document non trouvé' });
        }
        const fileName = path.basename(document.file_path);
        const filePath = path.join('./public/documents/documents_upload',fileName);
        const fileExtension = path.extname(fileName);
        
        let name = document.nomFr+fileExtension;
        if(lang==='en'){
            name = document.nomEn+fileExtension;
        }
    
        res.download(filePath,name);
      } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Erreur lors du téléchargement du document', error });
      }

}

export const deleteDoc = async (req, res) => {
    try {
        const {id}=req.params
        const document = await Document.findById(id);
        if (!document) {
          return res.status(404).json({ message: 'Document non trouvé' });
        }
    
        const fileName = path.basename(document.file_path);
        const filePath = path.resolve('./public/documents/documents_upload',fileName);
        // Supprimer le fichier du système de fichiers
        fs.unlink(filePath, async (err) => {
          if (err) {
            return res.status(500).json({ message: 'Erreur lors de la suppression du fichier', error: err });
          }
    
          // Supprimer l'entrée de la base de données
          await Document.findByIdAndDelete(id);
          res.status(200).json({ message: { fr: "Le document a été supprimé avec succès.", en: "Document has been successfully deleted." } });
        });
      } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la suppression du document', error });
      }
}
