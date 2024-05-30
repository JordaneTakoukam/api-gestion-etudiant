import Setting from '../../../models/setting.model.js';
import { message } from '../../../configs/message.js';
import { DateTime } from 'luxon';
import mongoose from 'mongoose';

// create
export const createEtatsEvenement = async (req, res) => { 
    const { code, libelleFr, libelleEn } = req.body;

    try {
        // Vérifier si tous les champs obligatoires sont présents
        if (!code || !libelleFr || !libelleEn) {
            return res.status(400).json({
                success: false,
                message: message.champ_obligatoire
            });
        }
         // Vérifier si le code du statut de l'évènement existe déjà
         const existingCode = await Setting.findOne({
            'etatsEvenement.code': code,
        });
        
        if (existingCode) {
            return res.status(400).json({
                success: false,
                message: message.existe_code,
            });
        }
        // Vérifier si le libelle fr du statut de l'évènement existe déjà
        const existingLibelleFr = await Setting.findOne({
            'etatsEvenement.libelleFr': libelleFr,
        });
        if (existingLibelleFr) {
            return res.status(400).json({
                success: false,
                message: message.existe_libelle_fr,
            });
        }
        // Vérifier si le libelle en du statut de l'évènement existe déjà
        const existingLibelleEn = await Setting.findOne({
            'etatsEvenement.libelleEn': libelleEn,
        });

        if (existingLibelleEn) {
            return res.status(400).json({
                success: false,
                message: message.existe_libelle_en,
            });
        }

        const date_creation = DateTime.now().toJSDate();

        // Créer un nouveau etatsevenement
        const newEtatsEvenement = { code, libelleFr, libelleEn, date_creation };

        // Vérifier si la collection "Setting" existe
        const setting = await Setting.findOne();

        var data = null;
        if (!setting) {
            // Create the collection and document
            data = await Setting.create({ etatsEvenement: [newEtatsEvenement] });
        } else {
            // Update the existing document
            data = await Setting.findOneAndUpdate({}, { $push: { etatsEvenement: newEtatsEvenement } }, { new: true });
        }

        // Récupérer le dernier élément du tableau etatsevenement
        const newEtatsEvenementObject = data.etatsEvenement[data.etatsEvenement.length - 1];

        res.json({
            success: true,
            message: message.ajouter_avec_success,
            data: newEtatsEvenementObject, // Retourner seulement l'objet de etatsevenement créé
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
export const readEtatsEvenement = async (req, res) => { }


export const readEtatsEvenements = async (req, res) => {}


// update
export const updateEtatsEvenement = async (req, res) => {
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

        // Rechercher le etatsevenement correspondant dans la collection Setting
        const etatsEvenement = await Setting.aggregate([
            { $unwind: "$etatsEvenement" }, // Dérouler le tableau de etatsevenement
            { $match: { "etatsEvenement._id": new mongoose.Types.ObjectId(id) } }, // Filtrer le etatsevenement par son ID
            { $project: { etatsEvenement: 1 } } // Projeter uniquement le etatsevenement
        ]);

        // Vérifier si le etatsevenement existe
        if (etatsEvenement.length === 0) {
            return res.status(404).json({
                success: false,
                message: message.non_trouvee,
            });
        }

        const existingEtatsEvenement = etatsEvenement[0].etatsEvenement;

        // Vérifier si les données existantes sont identiques aux nouvelles données
        if (existingEtatsEvenement.code === code && existingEtatsEvenement.libelleFr === libelleFr && existingEtatsEvenement.libelleEn === libelleEn) {
            return res.json({
                success: true,
                message: message.donne_a_jour,
                data: existingEtatsEvenement,
            });
        }

        //vérifier si le code existe déjà or mis le code de l'élément en cours de modification
        if (existingEtatsEvenement.code !== code) {
            const existingCode = await Setting.findOne({ 'etatsEvenement.code': code });
            if (existingCode) {
                return res.status(400).json({
                    success: false,
                    message: message.existe_code
                });
            }
        }
        //vérifier si le libelle fr existe déjà or mis le libelle fr de l'élément en cours de modification
        if (existingEtatsEvenement.libelleFr !== libelleFr) {
            const existingLibelleFr = await Setting.findOne({ 'etatsEvenement.libelleFr': libelleFr });
            if (existingLibelleFr) {
                return res.status(400).json({
                    success: false,
                    message: message.existe_libelle_fr
                });
            }
        }
        //vérifier si le libelle en existe déjà or mis le libelle en de l'élément en cours de modification
        if (existingEtatsEvenement.libelleEn !== libelleEn) {
            const existingLibelleEn = await Setting.findOne({ 'etatsEvenement.libelleEn': libelleEn });
            if (existingLibelleEn) {
                return res.status(400).json({
                    success: false,
                    message: message.existe_libelle_en
                });
            }
        }

        const updatedEtatsEvenement = { ...existingEtatsEvenement };

        // Mettre à jour les champs modifiés
        updatedEtatsEvenement.code = code;
        updatedEtatsEvenement.libelleFr = libelleFr;
        updatedEtatsEvenement.libelleEn = libelleEn;

        // Mettre à jour le etatsevenement dans la base de données
        await Setting.updateOne(
            { "etatsEvenement._id": new mongoose.Types.ObjectId(id) }, // Trouver le etatsevenement par son ID
            { $set: { "etatsEvenement.$": updatedEtatsEvenement } } // Mettre à jour le etatsevenement
        );

        // Envoyer la réponse avec les données mises à jour
        return res.json({
            success: true,
            message: message.mis_a_jour,
            data: updatedEtatsEvenement,
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
export const deleteEtatsEvenement = async (req, res) => {
    const { id } = req.params;

    try {
        // Vérifier si id est un ObjectId valide
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide,
            });
        }

        const setting = await Setting.findOneAndUpdate({}, { $pull: { etatsEvenement: { _id: new mongoose.Types.ObjectId(id) } } }, { new: true });

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


