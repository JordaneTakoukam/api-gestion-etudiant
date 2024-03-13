import Setting from './../../../models/setting.model.js';
import { message } from '../../../configs/message.js';
import { DateTime } from 'luxon';
import mongoose from 'mongoose';

// create
export const createFonction = async (req, res) => { 
    const { code, libelle } = req.body;

    try {
        // Vérifier si le fonction existe déjà
        const existingFonction = await Setting.findOne({
            'fonctions.code': code,
            'fonctions.libelle': libelle,
        });

        if (existingFonction) {
            return res.status(400).json({
                success: false,
                message: message.existe_deja,
            });
        }

        const date_creation = DateTime.now().toJSDate();

        // Créer un nouveau fonction
        const newFonction = { code, libelle, date_creation };

        // Vérifier si la collection "Setting" existe
        const setting = await Setting.findOne();

        var data = null;
        if (!setting) {
            // Create the collection and document
            data = await Setting.create({ fonctions: [newFonction] });
        } else {
            // Update the existing document
            data = await Setting.findOneAndUpdate({}, { $push: { fonctions: newFonction } }, { new: true });
        }

        // Récupérer le dernier élément du tableau fonctions
        const newFonctionObject = data.fonctions[data.fonctions.length - 1];

        res.json({
            success: true,
            message: message.ajouter_avec_success,
            data: newFonctionObject, // Retourner seulement l'objet de fonction créé
        });

    } catch (error) {
        console.error("Erreur interne au serveur :", error);
        res.status(500).json({
            success: false,
            message: message.erreurServeur,
        });
    }
}

// read
export const readFonction = async (req, res) => { }


export const readFonctions = async (req, res) => {
    try {
        // Définir la limite par défaut
        const defaultLimit = 10;

        // Extraire le paramètre `limit` de la requête
        let { limit } = req.query;

        // Utiliser la limite par défaut si le paramètre `limit` n'est pas défini ou invalide
        if (!limit || isNaN(parseInt(limit)) || parseInt(limit) < 1) {
            limit = defaultLimit.toString();
        }

        // Récupérer les fonctions filtrés par date de création avec la limite appliquée
        const filteredFonctions = await Setting.aggregate([
            { $unwind: "$fonctions" }, // Dérouler le tableau de fonctions
            { $match: { "fonctions.date_creation": { $exists: true, $ne: null } } }, // Filtrer les fonctions ayant une date de création définie
            { $sort: { "fonctions.date_creation": -1 } }, // Trier les fonctions par date de création (du plus récent au plus ancien)
            { $limit: parseInt(limit) } // Appliquer la limite
        ]);

        // Extraire uniquement les champs nécessaires des fonctions
        const formattedFonctions = filteredFonctions.map(doc => doc.fonctions);

        // Nombre total d'éléments dans la base de données (à récupérer)
        const totalCount = await Setting.aggregate([
            { $unwind: "$fonctions" }, // Dérouler le tableau de fonctions
            { $match: { "fonctions.date_creation": { $exists: true, $ne: null } } }, // Filtrer les fonctions ayant une date de création définie
            { $count: "total" } // Compter le nombre total d'éléments
        ]);

        // Récupérer le nombre total d'éléments (s'il existe)
        const total = totalCount.length > 0 ? totalCount[0].total : 0;

        // Envoyer la réponse avec les données et les informations sur le nombre d'éléments
        res.json({
            success: true,
            count: formattedFonctions.length, // Nombre d'éléments retournés
            totalCount: total, // Nombre total d'éléments dans la base de données
            data: formattedFonctions,
        });
    } catch (error) {
        console.error("Erreur interne au serveur :", error);
        res.status(500).json({
            success: false,
            message: "Erreur interne au serveur",
        });
    }
}


// update
export const updateFonction = async (req, res) => {
    const { id } = req.params;
    const { code, libelle } = req.body;

    try {
        // Vérifier si id est un ObjectId valide
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "L'ID de la fonction n'est pas valide.",
            });
        }

        // Rechercher le fonction correspondant dans la collection Setting
        const fonction = await Setting.aggregate([
            { $unwind: "$fonctions" }, // Dérouler le tableau de fonctions
            { $match: { "fonctions._id": new mongoose.Types.ObjectId(id) } }, // Filtrer le fonction par son ID
            { $project: { fonctions: 1 } } // Projeter uniquement le fonction
        ]);

        // Vérifier si le fonction existe
        if (fonction.length === 0) {
            return res.status(404).json({
                success: false,
                message: message.non_trouvee,
            });
        }

        const existingFonction = fonction[0].fonctions;

        // Vérifier si les données existantes sont identiques aux nouvelles données
        if (existingFonction.code === code && existingFonction.libelle === libelle) {
            return res.json({
                success: true,
                message: "Les données de la fonction sont déjà à jour.",
                data: existingFonction,
            });
        }

        const updatedFonction = { ...existingFonction };

        // Mettre à jour les champs modifiés
        if (code !== undefined) {
            updatedFonction.code = code;
        }
        if (libelle !== undefined) {
            updatedFonction.libelle = libelle;
        }

        // Mettre à jour le fonction dans la base de données
        await Setting.updateOne(
            { "fonctions._id": new mongoose.Types.ObjectId(id) }, // Trouver le fonction par son ID
            { $set: { "fonctions.$": updatedFonction } } // Mettre à jour le fonction
        );

        // Envoyer la réponse avec les données mises à jour
        return res.json({
            success: true,
            message: message.mis_a_jour,
            data: updatedFonction,
        });
    } catch (error) {
        console.error("Erreur interne au serveur :", error);
        return res.status(500).json({
            success: false,
            message: message.erreurServeur,
        });
    }
}

// delete
export const deleteFonction = async (req, res) => {
    const { id } = req.params;

    try {
        // Vérifier si id est un ObjectId valide
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide,
            });
        }

        const setting = await Setting.findOneAndUpdate({}, { $pull: { fonctions: { _id: new mongoose.Types.ObjectId(id) } } }, { new: true });

        if (!setting) {
            return res.status(404).json({
                success: false,
                message: message.non_trouvee,
            });
        }

        res.json({
            success: true,
            message: message.supprimer_avec_success,
        });
    } catch (error) {
        console.error("Erreur interne au serveur :", error);
        res.status(500).json({
            success: false,
            message: message.erreurServeur,
        });
    }
}


