import mongoose from 'mongoose';
import Document from '../../models/document.model.js'
import multer from 'multer';
import archiver from 'archiver';
import path from 'path';
import fs from 'fs';
import { DateTime } from 'luxon';
import { message } from '../../configs/message.js';

// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         cb(null, './public/documents/documents_upload/');
//     },
//     filename: function (req, file, cb) {
//         const extension = path.extname(file.originalname);
//         const timestamp = DateTime.now().toFormat('X');
//         const fileName = `${timestamp}-${file.originalname}`;
//         cb(null, fileName);
//     }
// });

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = './public/documents/documents_upload/';

        // Créer le répertoire s'il n'existe pas
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        cb(null, dir); // Utilisez le chemin correct
    },
    filename: function (req, file, cb) {
        const extension = path.extname(file.originalname);
        const timestamp = DateTime.now().toFormat('X'); // Génère un timestamp unique
        const fileName = `${timestamp}-${file.originalname}`; // Concatène timestamp et nom du fichier original
        cb(null, fileName);
    }
});

const upload = multer({ storage });

// Contrôleur pour télécharger un fichier et l'enregistrer en base de données
export const uploadDoc = [
    upload.single('file'),
    async (req, res) => {
        const { nomFr, nomEn } = req.body;

        if (!nomFr || !nomEn) {
            return res.status(400).json({ success: false, message: message.champ_obligatoire });
        }

        if (!req.file || !req.file.filename) {
            return res.status(400).json({ success: false, message: message.fournir_fichier });
        }

        const dateCreation = DateTime.now().toJSDate();
        const file_path = `/private/documents/documents_upload/${req.file.filename}`;

        const newDocument = new Document({
            nomFr,
            nomEn,
            date_creation: dateCreation,
            file_path // Enregistrer le chemin du fichier
        });

        try {
            const savedDocument = await newDocument.save();
            res.status(200).json({
                success: true,
                data: savedDocument,
                message: message.ajouter_avec_success
            });
        } catch (error) {
             // Gestion des erreurs spécifiques à multer
             if (error instanceof multer.MulterError) {
                return res.status(400).json({
                    success: false,
                    message: message.erreur_upload,
                });
            }
            console.error("Erreur lors de l'enregistrement du document :", error);
            res.status(500).json({ success: false, message: message.erreurServeur});
        }
    }
];

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
                documentUploads:documents,
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
        const {id}=req.params;
        const document = await Document.findById(id);
        if (!document) {
          return res.status(404).json({ message: message.document_non_trouve });
        }
        const fileName = path.basename(document.file_path);
        const filePath = path.join('./public/documents/documents_upload',fileName);        
    
        res.download(filePath,fileName);
      } catch (error) {
        console.log(error)
        res.status(500).json({success:false, message: message.erreur_upload });
      }

}

export const deleteDoc = async (req, res) => {
    try {
        const {id}=req.params
        const document = await Document.findById(id);
        if (!document) {
          return res.status(404).json({ message: message.document_non_trouve });
        }
    
        const fileName = path.basename(document.file_path);
        const filePath = path.resolve('./public/documents/documents_upload',fileName);
        // Supprimer le fichier du système de fichiers
        fs.unlink(filePath, async (err) => {
          if (err) {
            return res.status(500).json({success:false, message: message.erreur_suppression });
          }
    
          // Supprimer l'entrée de la base de données
          await Document.findByIdAndDelete(id);
          res.status(200).json({success:true, message: message.supprimer_avec_success });
        });
      } catch (error) {
        res.status(500).json({success:false, message: message.erreurServeur, error });
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
        res.status(500).json({success:false, message: message.erreur_upload });
    }
};
