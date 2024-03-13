import Setting from './../../../models/setting.model.js';
import { message } from '../../../configs/message.js';
import { DateTime } from 'luxon';
import mongoose from 'mongoose';

// create
export const createSection = async (req, res) => { 
    const { code, libelle } = req.body;

    try {
        // Vérifier si le section existe déjà
        const existingSection = await Setting.findOne({
            'sections.code': code,
            'sections.libelle': libelle,
        });

        if (existingSection) {
            return res.status(400).json({
                success: false,
                message: message.existe_deja,
            });
        }

        const date_creation = DateTime.now().toJSDate();

        // Créer un nouveau section
        const newSection = { code, libelle, date_creation };

        // Vérifier si la collection "Setting" existe
        const setting = await Setting.findOne();

        var data = null;
        if (!setting) {
            // Create the collection and document
            data = await Setting.create({ sections: [newSection] });
        } else {
            // Update the existing document
            data = await Setting.findOneAndUpdate({}, { $push: { sections: newSection } }, { new: true });
        }

        // Récupérer le dernier élément du tableau sections
        const newSectionObject = data.sections[data.sections.length - 1];

        res.json({
            success: true,
            message: message.ajouter_avec_success,
            data: newSectionObject, // Retourner seulement l'objet de section créé
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
export const readSection = async (req, res) => { }


export const readSections = async (req, res) => {
    try {
        // Définir la limite par défaut
        const defaultLimit = 10;

        // Extraire le paramètre `limit` de la requête
        let { limit } = req.query;

        // Utiliser la limite par défaut si le paramètre `limit` n'est pas défini ou invalide
        if (!limit || isNaN(parseInt(limit)) || parseInt(limit) < 1) {
            limit = defaultLimit.toString();
        }

        // Récupérer les sections filtrés par date de création avec la limite appliquée
        const filteredSections = await Setting.aggregate([
            { $unwind: "$sections" }, // Dérouler le tableau de sections
            { $match: { "sections.date_creation": { $exists: true, $ne: null } } }, // Filtrer les sections ayant une date de création définie
            { $sort: { "sections.date_creation": -1 } }, // Trier les sections par date de création (du plus récent au plus ancien)
            { $limit: parseInt(limit) } // Appliquer la limite
        ]);

        // Extraire uniquement les champs nécessaires des sections
        const formattedSections = filteredSections.map(doc => doc.sections);

        // Nombre total d'éléments dans la base de données (à récupérer)
        const totalCount = await Setting.aggregate([
            { $unwind: "$sections" }, // Dérouler le tableau de sections
            { $match: { "sections.date_creation": { $exists: true, $ne: null } } }, // Filtrer les sections ayant une date de création définie
            { $count: "total" } // Compter le nombre total d'éléments
        ]);

        // Récupérer le nombre total d'éléments (s'il existe)
        const total = totalCount.length > 0 ? totalCount[0].total : 0;

        // Envoyer la réponse avec les données et les informations sur le nombre d'éléments
        res.json({
            success: true,
            count: formattedSections.length, // Nombre d'éléments retournés
            totalCount: total, // Nombre total d'éléments dans la base de données
            data: formattedSections,
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
export const updateSection = async (req, res) => {
    const { id } = req.params;
    const { code, libelle } = req.body;

    try {
        // Vérifier si id est un ObjectId valide
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "L'ID de la section n'est pas valide.",
            });
        }

        // Rechercher le section correspondant dans la collection Setting
        const section = await Setting.aggregate([
            { $unwind: "$sections" }, // Dérouler le tableau de sections
            { $match: { "sections._id": new mongoose.Types.ObjectId(id) } }, // Filtrer le section par son ID
            { $project: { sections: 1 } } // Projeter uniquement le section
        ]);

        // Vérifier si le section existe
        if (section.length === 0) {
            return res.status(404).json({
                success: false,
                message: message.non_trouvee,
            });
        }

        const existingSection = section[0].sections;

        // Vérifier si les données existantes sont identiques aux nouvelles données
        if (existingSection.code === code && existingSection.libelle === libelle) {
            return res.json({
                success: true,
                message: "Les données de la section sont déjà à jour.",
                data: existingSection,
            });
        }

        const updatedSection = { ...existingSection };

        // Mettre à jour les champs modifiés
        if (code !== undefined) {
            updatedSection.code = code;
        }
        if (libelle !== undefined) {
            updatedSection.libelle = libelle;
        }

        // Mettre à jour le section dans la base de données
        await Setting.updateOne(
            { "sections._id": new mongoose.Types.ObjectId(id) }, // Trouver le section par son ID
            { $set: { "sections.$": updatedSection } } // Mettre à jour le section
        );

        // Envoyer la réponse avec les données mises à jour
        return res.json({
            success: true,
            message: message.mis_a_jour,
            data: updatedSection,
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
export const deleteSection = async (req, res) => {
    const { id } = req.params;

    try {
        // Vérifier si id est un ObjectId valide
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide,
            });
        }

        const setting = await Setting.findOneAndUpdate({}, { $pull: { sections: { _id: new mongoose.Types.ObjectId(id) } } }, { new: true });

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


