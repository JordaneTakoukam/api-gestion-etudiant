import Setting from '../../../models/setting.model.js';
import { message } from '../../../configs/message.js';
import { DateTime } from 'luxon';
import mongoose from 'mongoose';

// create


export const createAnneeCourante = async (req, res) => {
    const { annee } = req.body;

    try {
        // Vérifier si l'année est présente dans la requête
        if (!annee) {
            return res.status(400).json({
                success: false,
                message: message.champ_obligatoire
            });
        }

        // Vérifier si la collection "Setting" existe
        let setting = await Setting.findOne();

        if (!setting) {
            // Si la collection n'existe pas, créer un nouveau document avec l'année courante
            setting = new Setting({ anneeCourante: annee });
        } else {
            // Si la collection existe, mettre à jour l'année courante
            setting.anneeCourante = annee;
        }

        // Enregistrer ou mettre à jour le document dans la base de données
        const savedSetting = await setting.save();

        res.json({
            success: true,
            message: message.ajouter_avec_success,
            data: savedSetting.anneeCourante
        });
    } catch (error) {
        console.error("Erreur interne au serveur :", error);
        res.status(500).json({
            success: false,
            message: "Erreur interne au serveur"
        });
    }
}
export const createPremiereAnnee = async (req, res) => {
    const { annee } = req.body;

    try {
        // Vérifier si l'année est présente dans la requête
        if (!annee) {
            return res.status(400).json({
                success: false,
                message: message.champ_obligatoire
            });
        }

        // Vérifier si la collection "Setting" existe
        let setting = await Setting.findOne();

        if (!setting) {
            // Si la collection n'existe pas, créer un nouveau document avec l'année courante
            setting = new Setting({ premiereAnnee: annee });
        } else {
            // Si la collection existe, mettre à jour l'année courante
            setting.premiereAnnee = annee;
        }

        // Enregistrer ou mettre à jour le document dans la base de données
        const savedSetting = await setting.save();

        res.json({
            success: true,
            message: message.ajouter_avec_success,
            data: savedSetting.anneeCourante
        });
    } catch (error) {
        console.error("Erreur interne au serveur :", error);
        res.status(500).json({
            success: false,
            message: "Erreur interne au serveur"
        });
    }
}


// read
export const readAnneeCourante = async (req, res) => { }


export const readAnneeCourantes = async (req, res) => {
    try {
        // Définir la limite par défaut
        const defaultLimit = 10;

        // Extraire le paramètre `limit` de la requête
        let { limit } = req.query;

        // Utiliser la limite par défaut si le paramètre `limit` n'est pas défini ou invalide
        if (!limit || isNaN(parseInt(limit)) || parseInt(limit) < 1) {
            limit = defaultLimit.toString();
        }

        // Récupérer les anneecourante filtrés par date de création avec la limite appliquée
        const filteredAnneeCourante = await Setting.aggregate([
            { $unwind: "$anneeCourante" }, // Dérouler le tableau de anneecourante
            { $match: { "anneeCourante.date_creation": { $exists: true, $ne: null } } }, // Filtrer les anneecourante ayant une date de création définie
            { $sort: { "anneeCourante.date_creation": -1 } }, // Trier les anneecourante par date de création (du plus récent au plus ancien)
            { $limit: parseInt(limit) } // Appliquer la limite
        ]);

        // Extraire uniquement les champs nécessaires des anneecourante
        const formattedAnneeCourante = filteredAnneeCourante.map(doc => doc.anneecourante);

        // Nombre total d'éléments dans la base de données (à récupérer)
        const totalCount = await Setting.aggregate([
            { $unwind: "$typenseignement" }, // Dérouler le tableau de anneecourante
            { $match: { "anneeCourante.date_creation": { $exists: true, $ne: null } } }, // Filtrer les anneecourante ayant une date de création définie
            { $count: "total" } // Compter le nombre total d'éléments
        ]);

        // Récupérer le nombre total d'éléments (s'il existe)
        const total = totalCount.length > 0 ? totalCount[0].total : 0;

        // Envoyer la réponse avec les données et les informations sur le nombre d'éléments
        res.json({
            success: true,
            count: formattedAnneeCourante.length, // Nombre d'éléments retournés
            totalCount: total, // Nombre total d'éléments dans la base de données
            data: formattedAnneeCourante,
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
export const updateAnneeCourante = async (req, res) => {
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

        // Rechercher le anneecourante correspondant dans la collection Setting
        const anneeCourante = await Setting.aggregate([
            { $unwind: "$anneeCourante" }, // Dérouler le tableau de anneecourante
            { $match: { "anneeCourante._id": new mongoose.Types.ObjectId(id) } }, // Filtrer le anneecourante par son ID
            { $project: { anneeCourante: 1 } } // Projeter uniquement le anneecourante
        ]);

        // Vérifier si le anneecourante existe
        if (anneeCourante.length === 0) {
            return res.status(404).json({
                success: false,
                message: message.non_trouvee,
            });
        }

        const existingAnneeCourante = anneeCourante[0].anneeCourante;

        // Vérifier si les données existantes sont identiques aux nouvelles données
        if (existingAnneeCourante.code === code && existingAnneeCourante.libelleFr === libelleFr && existingAnneeCourante.libelleEn === libelleEn) {
            return res.json({
                success: true,
                message: message.donne_a_jour,
                data: existingAnneeCourante,
            });
        }

        //vérifier si le code existe déjà or mis le code de l'élément en cours de modification
        if (existingAnneeCourante.code !== code) {
            const existingCode = await Setting.findOne({ 'anneeCourante.code': code });
            if (existingCode) {
                return res.status(400).json({
                    success: false,
                    message: message.existe_code
                });
            }
        }
        //vérifier si le libelle fr existe déjà or mis le libelle fr de l'élément en cours de modification
        if (existingAnneeCourante.libelleFr !== libelleFr) {
            const existingLibelleFr = await Setting.findOne({ 'anneeCourante.libelleFr': libelleFr });
            if (existingLibelleFr) {
                return res.status(400).json({
                    success: false,
                    message: message.existe_libelle_fr
                });
            }
        }
        //vérifier si le libelle en existe déjà or mis le libelle en de l'élément en cours de modification
        if (existingAnneeCourante.libelleEn !== libelleEn) {
            const existingLibelleEn = await Setting.findOne({ 'anneeCourante.libelleEn': libelleEn });
            if (existingLibelleEn) {
                return res.status(400).json({
                    success: false,
                    message: message.existe_libelle_en
                });
            }
        }

        const updatedAnneeCourante = { ...existingAnneeCourante };

        // Mettre à jour les champs modifiés
        updatedAnneeCourante.code = code;
        updatedAnneeCourante.libelleFr = libelleFr;
        updatedAnneeCourante.libelleEn = libelleEn;

        // Mettre à jour le anneecourante dans la base de données
        await Setting.updateOne(
            { "anneeCourante._id": new mongoose.Types.ObjectId(id) }, // Trouver le anneecourante par son ID
            { $set: { "anneeCourante.$": updatedAnneeCourante } } // Mettre à jour le anneecourante
        );

        // Envoyer la réponse avec les données mises à jour
        return res.json({
            success: true,
            message: message.mis_a_jour,
            data: updatedAnneeCourante,
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
export const deleteAnneeCourante = async (req, res) => {
    const { id } = req.params;

    try {
        // Vérifier si id est un ObjectId valide
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide,
            });
        }

        const setting = await Setting.findOneAndUpdate({}, { $pull: { anneeCourante: { _id: new mongoose.Types.ObjectId(id) } } }, { new: true });

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


