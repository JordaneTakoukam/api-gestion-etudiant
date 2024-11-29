import mongoose from 'mongoose';
import SupportDeCours from '../../models/support_cours.model.js'
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { DateTime } from 'luxon';
import { message } from '../../configs/message.js';
import { appConfigs } from '../../configs/app_configs.js';
import User from '../../models/user.model.js';


// Configuration de stockage pour multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = './public/supports/supports_upload/';

        // Crée le répertoire s'il n'existe pas
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        cb(null, dir);
    },
    filename: function (req, file, cb) {
        const extension = path.extname(file.originalname);
        const timestamp = DateTime.now().toFormat('X'); // Génère un timestamp unique
        const fileName = `${timestamp}-${file.originalname}`;
        cb(null, fileName);
    }
});

const upload = multer({
    storage,
    // fileFilter: (req, file, cb) => {
    //     const allowedMimeTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    //     if (!allowedMimeTypes.includes(file.mimetype)) {
    //         return cb(new Error('Type de fichier non autorisé.'), false);
    //     }
    //     cb(null, true);
    // },
    limits: { fileSize: 10 * 1024 * 1024 } // Limite de taille de fichier à 10 Mo
});

// Contrôleur pour créer un support de cours
export const createSupport = [
    upload.single('file'),
    async (req, res) => {
        try {
            const {
                titre_en,
                titre_fr,
                type,
                description_en,
                description_fr,
                niveau,
                annee,
                user
            } = req.body;

            // Vérification des champs obligatoires
            const requiredFields = ['titre_en', 'titre_fr', 'user', 'niveau', 'annee', 'type'];
            for (const field of requiredFields) {
                if (!req.body[field]) {
                    return res.status(400).json({
                        success: false,
                        message: message.champ_obligatoire,
                    });
                }
            }

            // Vérification des IDs
            if (!mongoose.Types.ObjectId.isValid(user) || !mongoose.Types.ObjectId.isValid(niveau)) {
                return res.status(400).json({
                    success: false,
                    message: message.identifiant_invalide,
                });
            }

            

            // Vérification du type
            if (![0, 1].includes(parseInt(type))) {
                return res.status(400).json({
                    success: false,
                    message: message.type_fichier_invalide,
                });
            }

            // Vérification du fichier
            if (!req.file || !req.file.filename) {
                return res.status(400).json({
                    success: false,
                    message: message.fournir_fichier,
                });
            }

            const fichier = `/private/supports/supports_upload/${req.file.filename}`;
            const fileSizeInMB = Math.ceil(req.file.size / (1024));

            // Création du support de cours
            const support = new SupportDeCours({
                titre_en,
                titre_fr,
                type: parseInt(type),
                description_en,
                description_fr,
                fichier,
                niveau,
                utilisateur: user,
                annee,
                size : fileSizeInMB
            });

            await support.save();
            const populatedSupport = await SupportDeCours.populate(support, [
                { path: 'utilisateur', select: 'nom prenom' },
            ]);
            res.status(201).json({
                success: true,
                message: message.ajouter_avec_success,
                data : populatedSupport,
            });
        } catch (error) {
            // Gestion des erreurs spécifiques à multer
            if (error instanceof multer.MulterError) {
                return res.status(400).json({
                    success: false,
                    message: message.erreur_upload,
                });
            }

            res.status(500).json({
                success: false,
                message: message.erreurServeur,
            });
        }
    }
];


export const updateSupport = [
    upload.single('file'), // Optionnel : Permet de mettre à jour le fichier si nécessaire
    async (req, res) => {
        try {
            const { id } = req.params; // ID du support à mettre à jour
            const {
                titre_en,
                titre_fr,
                type,
                description_en,
                description_fr,
                niveau,
                annee,
            } = req.body;

            // Vérification de l'existence du support
            const support = await SupportDeCours.findById(id);
            if (!support) {
                return res.status(404).json({
                    success: false,
                    message: message.support_non_trouve,
                });
            }

            // Vérification des IDs
            if (niveau && !mongoose.Types.ObjectId.isValid(niveau)) {
                return res.status(400).json({
                    success: false,
                    message: message.identifiant_invalide
                });
            }

            
            // Vérification du type
            if (type && ![0, 1].includes(parseInt(type))) {
                return res.status(400).json({
                    success: false,
                    message: message.type_fichier_invalide
                });
            }

            // Mise à jour des champs
            support.titre_en = titre_en || support.titre_en;
            support.titre_fr = titre_fr || support.titre_fr;
            support.type = type !== undefined ? parseInt(type) : support.type;
            support.description_en = description_en || support.description_en;
            support.description_fr = description_fr || support.description_fr;
            support.niveau = niveau || support.niveau;
            support.annee = annee || support.annee;

            // Mise à jour du fichier si fourni
            if (req.file && req.file.filename) {
                const fichier = `/private/supports/supports_upload/${req.file.filename}`;
                const fileSizeInMB = Math.ceil(req.file.size / (1024));

                

                // Supprimer l'ancien fichier (si besoin)
                if (support.fichier) {
                    // const oldFilePath = `./public${support.fichier}`;
                    const fileName = path.basename(support.fichier);
                    const oldFilePath = path.join('./public/supports/supports_upload',fileName);  
                    
                    if (fs.existsSync(oldFilePath)) {
                        fs.unlinkSync(oldFilePath);
                    }
                }

                support.fichier = fichier;
                support.size = fileSizeInMB;
            }

            await support.save();
            const populatedSupport = await SupportDeCours.populate(support, [
                { path: 'utilisateur', select: 'nom prenom' },
            ]);
            res.status(200).json({
                success: true,
                message: message.mis_a_jour,
                data : populatedSupport,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message:message.erreurServeur,
            });
        }
    }
];



export const deleteSupport = async (req, res) => {
    try {
        const { id } = req.params; // ID du support à supprimer

        // Vérification de l'existence du support
        const support = await SupportDeCours.findById(id);
        if (!support) {
            return res.status(404).json({
                success: false,
                message: message.support_non_trouve,
            });
        }

        // Suppression du fichier associé
        if (support.fichier) {
            // const filePath = `./public${support.fichier}`;
            const fileName = path.basename(support.fichier);
            const filePath = path.join('./public/supports/supports_upload',fileName); 
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        // Suppression du support de cours
        await SupportDeCours.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: message.supprimer_avec_success,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: message.erreurServeur,
        });
    }
};


export const getSupportsByFilters = async (req, res) => {
    try {
        const { type, niveau, annee, page = 1, limit = 10 } = req.query;

        // Validation des paramètres
        if (type && ![0, 1].includes(parseInt(type))) {
            return res.status(400).json({
                success: false,
                message: message.type_fichier_invalide,
            });
        }

        if (!niveau || !mongoose.Types.ObjectId.isValid(niveau)) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide,
            });
        }

        if (!annee || isNaN(annee)) {
            return res.status(400).json({
                success: false,
                message: message.nombre_entier,
            });
        }

        // Calcul des options de pagination
        const pageNumber = parseInt(page) > 0 ? parseInt(page) : 1;
        const pageSize = parseInt(limit) > 0 ? parseInt(limit) : 10;
        const skip = (pageNumber - 1) * pageSize;

        // Création des filtres dynamiques
        const query = {
            niveau: niveau,
            annee: parseInt(annee),
        };

        // Ajouter le type si fourni
        if (type !== undefined) {
            query.type = parseInt(type);
        }

        // Requête pour récupérer les supports avec pagination
        const [supports, totalSupports] = await Promise.all([
            SupportDeCours.find(query)
                .populate('utilisateur', 'nom prenom') // Popule les informations de l'utilisateur
                .sort({ dateAjout: -1 }) // Tri par date décroissante
                .skip(skip) // Sauter les documents précédents
                .limit(pageSize), // Limiter le nombre de documents retournés

            SupportDeCours.countDocuments(query),
        ]);

        // Retourne les supports avec les métadonnées de pagination
        res.status(200).json({
            success: true,
            data: {
                supportsDeCours: supports,
                currentPage: pageNumber,
                totalPages: Math.ceil(totalSupports / pageSize),
                totalItems: totalSupports,
                pageSize: pageSize,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: message.erreurServeur,
        });
    }
};



export const searchSupports = async (req, res) => {
    try {
        const { role, userId, niveauId, langue = 'fr', recherche = '', limit = 10 } = req.query;

        //validation du role
        const user = await User.findById(userId).select('roles');
        if(!user){
            return res.status(404).json({
                success: false,
                message:message.userNonTrouver,
            });
        }else{
            if(!user.roles.includes(role)){
                return res.status(404).json({
                    success: false,
                    message:message.invalid_role,
                });
            }
        }



        // Validation des paramètres
        if (!recherche.trim()) {
            return res.status(400).json({
                success: false,
                message:message.champ_obligatoire,
            });
        }

        // Déterminer le champ de recherche en fonction de la langue
        const titreField = langue === 'fr' ? 'titre_fr' : 'titre_en';

        // Construction de la requête de base
        let query = { [titreField]: { $regex: `^${recherche}`, $options: 'i' } }; // Recherche insensible à la casse

        // Filtrage en fonction du rôle
        switch (role) {
            case appConfigs.role.enseignant:
                query = {
                    ...query,
                    $or: [
                        { type: 0, utilisateur: userId }, // Supports visibles par l'enseignant et créés par lui
                        { type: 1, utilisateur: userId }, // Supports accessibles aux étudiants et crées par lui
                    ],
                };
                break;

            case appConfigs.role.etudiant:
            case appConfigs.role.delegue:
                if (!niveauId) {
                    return res.status(400).json({
                        success: false,
                        message: message.champ_obligatoire
                    });
                }
                query = {
                    ...query,
                    type: 1,   // Supports de type étudiant uniquement
                    niveau: niveauId, // Niveau correspondant à l'utilisateur
                };
                break;

            case appConfigs.role.admin:
            case appConfigs.role.superAdmin:
                // Aucun filtre supplémentaire
                break;

            default:
                return res.status(403).json({
                    success: false,
                    message: message.role_non_autorise,
                });
        }

        // Limite des résultats
        const limite = parseInt(limit) > 0 ? parseInt(limit) : 10;

        // Exécuter la requête
        const supports = await SupportDeCours.find(query)
            .populate('utilisateur', 'nom prenom') // Popule les informations de l'utilisateur
            .sort({ [titreField]: 1 }) // Tri alphabétique
            .limit(limite);


        res.status(200).json({
            success: true,
            data: {
                supportsDeCours:supports,
                currentPage: 1,
                totalPages: 1,
                totalItems: supports.length,
                pageSize : limite
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: message.erreurServeur,
        });
    }
};



export const downloadSupport = async (req, res) => {
    try {
        const { id } = req.params;

        const support = await SupportDeCours.findById(id);

        if (!support) {
            return res.status(404).json({ message: message.support_non_trouve });
        }

        const fileName = path.basename(support.fichier);
        const filePath = path.join('./public/supports/supports_upload',fileName);        
    
        res.download(filePath,fileName, (err) => {
            if (err) {
                res.status(500).json({ message: 'Erreur lors du téléchargement du fichier.', error: err });
            }
        });

       
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors du téléchargement du support.', error });
    }
};



