import mongoose from 'mongoose';
import Document from '../../models/document.model.js'
import multer from 'multer';
import archiver from 'archiver';
import path from 'path';
import fs from 'fs';
import { DateTime } from 'luxon';
import { message } from '../../configs/message.js';

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
        const { page = 1, pageSize = 10 } = req.query;

        const documents = await Document.find({})
            .skip((page - 1) * pageSize)
            .limit(parseInt(pageSize));

        const totalDocuments = await Document.countDocuments();

        res.json({
            success: true,
            message: message.liste_doc,
            data: {
                documents,
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalDocuments / parseInt(pageSize)),
                totalItems: totalDocuments,
                pageSize : pageSize
            },
        });
        
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

export const downloadPiecesJointes = async (req, res) => {
    try {
        const { file_paths } = req.query;  // Expecting a comma-separated list of IDs

        
        // Create a new archive
        const archive = archiver('zip', {
            zlib: { level: 9 } // Sets the compression level.
        });

        // Set the response header
        res.setHeader('Content-disposition', 'attachment; filename=pieces_jointes.zip');
        res.setHeader('Content-type', 'application/zip');

        // Pipe the archive data to the response
        archive.pipe(res);

        // Add files to the archive
        for (const file_path of file_paths) {
            const fileName = path.basename(file_path);
            const filePath = path.join('./public/documents/pieces_jointes', fileName);
            

            // Append files to the archive
            archive.file(filePath, { name: fileName });
        }

        // Finalize the archive
        archive.finalize();
        
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Erreur lors du téléchargement des documents', error });
    }
};
