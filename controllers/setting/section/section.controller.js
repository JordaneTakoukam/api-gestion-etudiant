import Setting from './../../../models/setting.model.js';
import { message } from '../../../configs/message.js';
import { DateTime } from 'luxon';
import mongoose from 'mongoose';

// create
export const createSection = async (req, res) => {
    const { code, libelleFr, libelleEn } = req.body;

    try {
        // Vérifier si tous les champs obligatoires sont présents
        if (!code || !libelleFr || !libelleEn) {
            return res.status(400).json({
                success: false,
                message: message.champ_obligatoire
            });
        }
        // Vérifier si le code de la section existe déjà
        const existingCode = await Setting.findOne({
            'sections.code': code,
        });

        if (existingCode) {
            return res.status(400).json({
                success: false,
                message: message.existe_code,
            });
        }
        // Vérifier si le libelle fr de la section existe déjà
        const existingLibelleFr = await Setting.findOne({
            'sections.libelleFr': libelleFr,
        });
        if (existingLibelleFr) {
            return res.status(400).json({
                success: false,
                message: message.existe_libelle_fr,
            });
        }
        // Vérifier si le libelle en de la section existe déjà
        const existingLibelleEn = await Setting.findOne({
            'sections.libelleEn': libelleEn,
        });

        if (existingLibelleEn) {
            return res.status(400).json({
                success: false,
                message: message.existe_libelle_en,
            });
        }

        const date_creation = DateTime.now().toJSDate();

        // Créer un nouveau section
        const newSection = { code, libelleFr, libelleEn, date_creation };

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

        // Récupérer le dernier élément du tableau section
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

        // Récupérer les section filtrés par date de création avec la limite appliquée
        const filteredSection = await Setting.aggregate([
            { $unwind: "$section" }, // Dérouler le tableau de section
            { $match: { "sections.date_creation": { $exists: true, $ne: null } } }, // Filtrer les section ayant une date de création définie
            { $sort: { "sections.date_creation": -1 } }, // Trier les section par date de création (du plus récent au plus ancien)
            { $limit: parseInt(limit) } // Appliquer la limite
        ]);

        // Extraire uniquement les champs nécessaires des section
        const formattedSection = filteredSection.map(doc => doc.section);

        // Nombre total d'éléments dans la base de données (à récupérer)
        const totalCount = await Setting.aggregate([
            { $unwind: "$sections" }, // Dérouler le tableau de section
            { $match: { "sections.date_creation": { $exists: true, $ne: null } } }, // Filtrer les section ayant une date de création définie
            { $count: "total" } // Compter le nombre total d'éléments
        ]);

        // Récupérer le nombre total d'éléments (s'il existe)
        const total = totalCount.length > 0 ? totalCount[0].total : 0;

        // Envoyer la réponse avec les données et les informations sur le nombre d'éléments
        res.json({
            success: true,
            count: formattedSection.length, // Nombre d'éléments retournés
            totalCount: total, // Nombre total d'éléments dans la base de données
            data: formattedSection,
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
    const { code, libelleFr, libelleEn } = req.body;

    try {
        // Vérifier si id est un ObjectId valide
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide
            });
        }
        // Vérifier si tous les champs obligatoires sont présents
        if (!code || !libelleFr || !libelleEn) {
            return res.status(400).json({
                success: false,
                message: message.champ_obligatoire
            });
        }

        // Rechercher le section correspondant dans la collection Setting
        const sections = await Setting.aggregate([
            { $unwind: "$sections" }, // Dérouler le tableau de section
            { $match: { "sections._id": new mongoose.Types.ObjectId(id) } }, // Filtrer le section par son ID
            { $project: { sections: 1 } } // Projeter uniquement le section
        ]);

        // Vérifier si le section existe
        if (sections.length === 0) {
            return res.status(404).json({
                success: false,
                message: message.non_trouvee,
            });
        }

        const existingSection = sections[0].section;

        // Vérifier si les données existantes sont identiques aux nouvelles données
        if (existingSection.code === code && existingSection.libelleFr === libelleFr && existingSection.libelleEn === libelleEn) {
            return res.json({
                success: true,
                message: message.donne_a_jour,
                data: existingSection,
            });
        }

        //vérifier si le code existe déjà or mis le code de l'élément en cours de modification
        if (existingSection.code !== code) {
            const existingCode = await Setting.findOne({ 'sections.code': code });
            if (existingCode) {
                return res.status(400).json({
                    success: false,
                    message: message.existe_code
                });
            }
        }
        //vérifier si le libelle fr existe déjà or mis le libelle fr de l'élément en cours de modification
        if (existingSection.libelleFr !== libelleFr) {
            const existingLibelleFr = await Setting.findOne({ 'sections.libelleFr': libelleFr });
            if (existingLibelleFr) {
                return res.status(400).json({
                    success: false,
                    message: message.existe_libelle_fr
                });
            }
        }
        //vérifier si le libelle en existe déjà or mis le libelle en de l'élément en cours de modification
        if (existingSection.libelleEn !== libelleEn) {
            const existingLibelleEn = await Setting.findOne({ 'sections.libelleEn': libelleEn });
            if (existingLibelleEn) {
                return res.status(400).json({
                    success: false,
                    message: message.existe_libelle_en
                });
            }
        }

        const updatedSection = { ...existingSection };

        // Mettre à jour les champs modifiés
        updatedSection.code = code;
        updatedSection.libelleFr = libelleFr;
        updatedSection.libelleEn = libelleEn;

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

        const setting = await Setting.findOneAndUpdate({}, { $pull: { section: { _id: new mongoose.Types.ObjectId(id) } } }, { new: true });

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


