import Setting from './../../../models/setting.model.js';
import { message } from '../../../configs/message.js';
import { DateTime } from 'luxon';
import mongoose from 'mongoose';

// create
export const createCategorie = async (req, res) => { 
    const { code, libelleFr, libelleEn } = req.body;

    try {
        // Vérifier si tous les champs obligatoires sont présents
        if (!code || !libelleFr || !libelleEn) {
            return res.status(400).json({
                success: false,
                message: message.champ_obligatoire
            });
        }
        
         // Vérifier si le code de la categorie existe déjà
        const existingCode = await Setting.findOne({
            'categories.code': code,
        });
        
        if (existingCode) {
            return res.status(400).json({
                success: false,
                message: message.existe_code,
            });
        }
        // Vérifier si le libelle fr de la categorie existe déjà
        const existingLibelleFr = await Setting.findOne({
            'categories.libelleFr': libelleFr,
        });
        if (existingLibelleFr) {
            return res.status(400).json({
                success: false,
                message: message.existe_libelle_fr,
            });
        }
        // Vérifier si le libelle en de la categorie existe déjà
        const existingLibelleEn = await Setting.findOne({
            'categories.libelleEn': libelleEn,
        });

        if (existingLibelleEn) {
            return res.status(400).json({
                success: false,
                message: message.existe_libelle_en,
            });
        }

        const date_creation = DateTime.now().toJSDate();

        // Créer un nouveau categorie
        const newCategorie = { code, libelleFr, libelleEn, date_creation };

        // Vérifier si la collection "Setting" existe
        const setting = await Setting.findOne();

        var data = null;
        if (!setting) {
            // Create the collection and document
            data = await Setting.create({ categories: [newCategorie] });
        } else {
            // Update the existing document
            data = await Setting.findOneAndUpdate({}, { $push: { categories: newCategorie } }, { new: true });
        }

        // Récupérer le dernier élément du tableau categories
        const newCategorieObject = data.categories[data.categories.length - 1];

        res.json({
            success: true,
            message: message.ajouter_avec_success,
            data: newCategorieObject, // Retourner seulement l'objet de categorie créé
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
export const readCategorie = async (req, res) => { }


export const readCategories = async (req, res) => {
    try {
        // Définir la limite par défaut
        const defaultLimit = 10;

        // Extraire le paramètre `limit` de la requête
        let { limit } = req.query;

        // Utiliser la limite par défaut si le paramètre `limit` n'est pas défini ou invalide
        if (!limit || isNaN(parseInt(limit)) || parseInt(limit) < 1) {
            limit = defaultLimit.toString();
        }

        // Récupérer les categories filtrés par date de création avec la limite appliquée
        const filteredCategories = await Setting.aggregate([
            { $unwind: "$categories" }, // Dérouler le tableau de categories
            { $match: { "categories.date_creation": { $exists: true, $ne: null } } }, // Filtrer les categories ayant une date de création définie
            { $sort: { "categories.date_creation": -1 } }, // Trier les categories par date de création (du plus récent au plus ancien)
            { $limit: parseInt(limit) } // Appliquer la limite
        ]);

        // Extraire uniquement les champs nécessaires des categories
        const formattedCategories = filteredCategories.map(doc => doc.categories);

        // Nombre total d'éléments dans la base de données (à récupérer)
        const totalCount = await Setting.aggregate([
            { $unwind: "$categories" }, // Dérouler le tableau de categories
            { $match: { "categories.date_creation": { $exists: true, $ne: null } } }, // Filtrer les categories ayant une date de création définie
            { $count: "total" } // Compter le nombre total d'éléments
        ]);

        // Récupérer le nombre total d'éléments (s'il existe)
        const total = totalCount.length > 0 ? totalCount[0].total : 0;

        // Envoyer la réponse avec les données et les informations sur le nombre d'éléments
        res.json({
            success: true,
            count: formattedCategories.length, // Nombre d'éléments retournés
            totalCount: total, // Nombre total d'éléments dans la base de données
            data: formattedCategories,
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
export const updateCategorie = async (req, res) => {
    const { id } = req.params;
    const { code, libelleFr, libelleEn } = req.body;

    try {
        // Vérifier si tous les champs obligatoires sont présents
        if (!code || !libelleFr || !libelleEn) {
            return res.status(400).json({
                success: false,
                message: message.champ_obligatoire
            });
        }
        // Vérifier si id est un ObjectId valide
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide
            });
        }

        // Rechercher le categorie correspondant dans la collection Setting
        const categorie = await Setting.aggregate([
            { $unwind: "$categories" }, // Dérouler le tableau de categories
            { $match: { "categories._id": new mongoose.Types.ObjectId(id) } }, // Filtrer le categorie par son ID
            { $project: { categories: 1 } } // Projeter uniquement le categorie
        ]);

        // Vérifier si le categorie existe
        if (categorie.length === 0) {
            return res.status(404).json({
                success: false,
                message: message.non_trouvee,
            });
        }

        const existingCategorie = categorie[0].categories;

        // Vérifier si les données existantes sont identiques aux nouvelles données
        if (existingCategorie.code === code && existingCategorie.libelleFr === libelleFr && existingCategorie.libelleEn === libelleEn) {
            return res.json({
                success: true,
                message: message.donne_a_jour,
                data: existingCategorie,
            });
        }

        //vérifier si le code existe déjà or mis le code de l'élément en cours de modification
        if (existingCategorie.code !== code) {
            const existingCode = await Setting.findOne({ 'categories.code': code });
            if (existingCode) {
                return res.status(400).json({
                    success: false,
                    message: message.existe_code
                });
            }
        }
        //vérifier si le libelle fr existe déjà or mis le libelle fr de l'élément en cours de modification
        if (existingCategorie.libelleFr !== libelleFr) {
            const existingLibelleFr = await Setting.findOne({ 'categories.libelleFr': libelleFr });
            if (existingLibelleFr) {
                return res.status(400).json({
                    success: false,
                    message: message.existe_libelle_fr
                });
            }
        }
        //vérifier si le libelle en existe déjà or mis le libelle en de l'élément en cours de modification
        if (existingCategorie.libelleEn !== libelleEn) {
            const existingLibelleEn = await Setting.findOne({ 'categories.libelleEn': libelleEn });
            if (existingLibelleEn) {
                return res.status(400).json({
                    success: false,
                    message: message.existe_libelle_en
                });
            }
        }

        const updatedCategorie = { ...existingCategorie };

        // Mettre à jour les champs modifiés
        updatedCategorie.code = code;
        updatedCategorie.libelleFr = libelleFr;
        updatedCategorie.libelleEn = libelleEn;

        // Mettre à jour le categorie dans la base de données
        await Setting.updateOne(
            { "categories._id": new mongoose.Types.ObjectId(id) }, // Trouver le categorie par son ID
            { $set: { "categories.$": updatedCategorie } } // Mettre à jour le categorie
        );

        // Envoyer la réponse avec les données mises à jour
        return res.json({
            success: true,
            message: message.mis_a_jour,
            data: updatedCategorie,
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
export const deleteCategorie = async (req, res) => {
    const { id } = req.params;

    try {
        // Vérifier si id est un ObjectId valide
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide,
            });
        }

        const setting = await Setting.findOneAndUpdate({}, { $pull: { categories: { _id: new mongoose.Types.ObjectId(id) } } }, { new: true });

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


