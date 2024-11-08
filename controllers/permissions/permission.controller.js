import Permission from '../../models/permission.model.js'
import { message } from '../../configs/message.js';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

// Contrôleur pour créer une nouvelle permission
export const createPermission = async (req, res) => {
    const { nom, libelleFr, libelleEn, descriptionFr, descriptionEn } = req.body;

    try {

        const requiredFields = ['nom', 'libelleFr', 'libelleEn'];

        for (const field of requiredFields) {
            if (!req.body[field]) {
                return res.status(400).json({
                    success: false,
                    message: message.champ_obligatoire,
                });
            }
        }
        const newPermission = new Permission({ nom, libelleFr, libelleEn, descriptionFr, descriptionEn });
        await newPermission.save();

        res.status(201).json({
            success: true,
            message: message.ajouter_avec_success,
            data: newPermission
        });
    } catch (error) {
        console.error("Erreur lors de la création de la permission :", error);
        res.status(500).json({
            success: false,
            message: message.erreurServeur
        });
    }
};

// Contrôleur pour modifier une permission existante
export const updatePermission = async (req, res) => {
    const { permissionId } = req.params;
    const { nom, libelleFr, libelleEn, descriptionFr, descriptionEn } = req.body;

    try {
        if (!permissionId) {
            return res.status(400).json({
                success: false,
                message: message.champ_obligatoire,
            });
        }
        const requiredFields = ['nom', 'libelleFr', 'libelleEn'];

        for (const field of requiredFields) {
            if (!req.body[field]) {
                return res.status(400).json({
                    success: false,
                    message: message.champ_obligatoire,
                });
            }
        }
        const updatedPermission = await Permission.findByIdAndUpdate(
            permissionId,
            { nom, libelleFr, libelleEn, descriptionFr, descriptionEn },
            { new: true }
        );

        if (!updatedPermission) {
            return res.status(404).json({
                success: false,
                message: message.permission_non_trouvee
            });
        }

        res.status(200).json({
            success: true,
            message: message.mis_a_jour,
            data: updatedPermission
        });
    } catch (error) {
        console.error("Erreur lors de la modification de la permission :", error);
        res.status(500).json({
            success: false,
            message: message.erreurServeur
        });
    }
};

// Contrôleur pour supprimer une permission
export const deletePermission = async (req, res) => {
    const { permissionId } = req.params;

    try {
        const deletedPermission = await Permission.findByIdAndDelete(permissionId);

        if (!deletedPermission) {
            return res.status(404).json({
                success: false,
                message: message.permission_non_trouvee
            });
        }

        res.status(200).json({
            success: true,
            message: message.supprimer_avec_success
        });
    } catch (error) {
        console.error("Erreur lors de la suppression de la permission :", error);
        res.status(500).json({
            success: false,
            message: message.erreurServeur
        });
    }
};


// Contrôleur pour récupérer la liste des permissions
export const getPermissions = async (req, res) => {
    try {
        const {langue } = req.query;  // Page et limit par défaut

        let permissions = [];

        if(langue ==='fr'){
            permissions = await Permission.find()
                .sort({ libelleFr: 1 });
        }else{
            permissions = await Permission.find()
                .sort({ libelleEn: 1 }) 
        }
        res.status(200).json({
            success: true,
            data: permissions
        });
    } catch (error) {
        console.error("Erreur lors de la récupération des permissions :", error);
        res.status(500).json({
            success: false,
            message: erreurServeur
        });
    }
};

export const getPermissionsWithPagination = async (req, res) => {
    try {
        const { page = 1, limit = 10, langue } = req.query;  // Page et limit par défaut

        // Convertir les valeurs de la page et du limit en entier
        const pageNumber = parseInt(page);
        const pageLimit = parseInt(limit);

       
        let permissions = [];

        // Récupérer les permissions avec pagination
        if(langue ==='fr'){
            permissions = await Permission.find()
                .sort({ libelleFr: 1 }) 
                .skip((pageNumber - 1) * pageLimit)  // Calculer l'offset
                .limit(pageLimit);  // Limiter le nombre de résultats
        }else{
            permissions = await Permission.find()
                .sort({ libelleEn: 1 }) 
                .skip((pageNumber - 1) * pageLimit)  // Calculer l'offset
                .limit(pageLimit);  // Limiter le nombre de résultats
        }

        // Récupérer le total des permissions pour le calcul de la pagination
        const totalPermissions = await Permission.countDocuments();
        const totalPages = Math.ceil(totalPermissions / pageLimit);


        res.status(200).json({
            success:true,
            data: {
                permissions,
                totalPages,
                currentPage: pageNumber,
                totalItems: totalPermissions,
                pageSize: pageLimit
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: message.erreurServeur });
    }
}

export const searchPermission = async (req, res) => {
    const {searchString } = req.params; // Récupère la chaîne de recherche depuis les paramètres de requête
    let {limit=5, langue} = req.query;
    limit = parseInt(limit);
    // console.log(searchString);
    try {
        // Construire la requête pour filtrer les permissions
        let query = {
             libelleFr: { $regex: `^${searchString}`, $options: 'i' } 
        }
        if(langue!=='fr'){
            query = {
                libelleEn: { $regex: `^${searchString}`, $options: 'i' } 
            }
        }

        let permissions = [];

        if(langue ==='fr'){
            permissions = await Permission.find(query)
                .sort({ libelleFr: 1 }) 
                .limit(limit); // Limite à 5 résultats
        }else{
            permissions = await Permission.find(query)
                .sort({libelleEn: 1 }) 
                .limit(limit); // Limite à 5 résultats
        }
       
        res.json({
            success: true,
            data: {
                permissions,
                currentPage: 0,
                totalPages: 1,
                totalItems: permissions.length,
                pageSize: limit,
            }
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des permissions :', error);
        res.status(500).json({ success: false, message: message.erreurServeur });
    }
};

export const createManyPermission = async(req, res)=>{
    try {
        

        // Lire le fichier JSON et le parser
        const fileData = fs.readFileSync('./permissions.json', 'utf8');
        console.log(fileData)
        const permissionsData = JSON.parse(fileData);

        // Vérifier si les permissions existent déjà
        const existingPermissions = await Permission.find();
        if (existingPermissions.length > 0) {
            return res.status(400).json({ message: 'Les permissions sont déjà enregistrées.' });
        }

        // Enregistrer les permissions en base de données
        const createdPermissions = await Permission.insertMany(permissionsData);
        return res.status(201).json({ message: 'Permissions enregistrées avec succès.', data: createdPermissions });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erreur serveur, impossible d\'enregistrer les permissions.', error });
    }
}


