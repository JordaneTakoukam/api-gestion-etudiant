import Setting from '../../../models/setting.model.js';
import { message } from '../../../configs/message.js';
import { DateTime } from 'luxon';
import mongoose from 'mongoose';

// create
export const createStatutEvenement = async (req, res) => { 
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
            'statutEvenement.code': code,
        });
        
        if (existingCode) {
            return res.status(400).json({
                success: false,
                message: message.existe_code,
            });
        }
        // Vérifier si le libelle fr du statut de l'évènement existe déjà
        const existingLibelleFr = await Setting.findOne({
            'statutEvenement.libelleFr': libelleFr,
        });
        if (existingLibelleFr) {
            return res.status(400).json({
                success: false,
                message: message.existe_libelle_fr,
            });
        }
        // Vérifier si le libelle en du statut de l'évènement existe déjà
        const existingLibelleEn = await Setting.findOne({
            'statutEvenement.libelleEn': libelleEn,
        });

        if (existingLibelleEn) {
            return res.status(400).json({
                success: false,
                message: message.existe_libelle_en,
            });
        }

        const date_creation = DateTime.now().toJSDate();

        // Créer un nouveau statutevenement
        const newStatutEvenement = { code, libelleFr, libelleEn, date_creation };

        // Vérifier si la collection "Setting" existe
        const setting = await Setting.findOne();

        var data = null;
        if (!setting) {
            // Create the collection and document
            data = await Setting.create({ statutEvenement: [newStatutEvenement] });
        } else {
            // Update the existing document
            data = await Setting.findOneAndUpdate({}, { $push: { statutEvenement: newStatutEvenement } }, { new: true });
        }

        // Récupérer le dernier élément du tableau statutevenement
        const newStatutEvenementObject = data.etatEvenement[data.etatEvenement.length - 1];

        res.json({
            success: true,
            message: message.ajouter_avec_success,
            data: newStatutEvenementObject, // Retourner seulement l'objet de statutevenement créé
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
export const readStatutEvenement = async (req, res) => { }


export const readStatutEvenements = async (req, res) => {}


// update
export const updateStatutEvenement = async (req, res) => {
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

        // Rechercher le statutevenement correspondant dans la collection Setting
        const statutEvenement = await Setting.aggregate([
            { $unwind: "$statutEvenement" }, // Dérouler le tableau de statutevenement
            { $match: { "statutEvenement._id": new mongoose.Types.ObjectId(id) } }, // Filtrer le statutevenement par son ID
            { $project: { statutEvenement: 1 } } // Projeter uniquement le statutevenement
        ]);

        // Vérifier si le statutevenement existe
        if (statutEvenement.length === 0) {
            return res.status(404).json({
                success: false,
                message: message.non_trouvee,
            });
        }

        const existingStatutEvenement = statutEvenement[0].statutEvenement;

        // Vérifier si les données existantes sont identiques aux nouvelles données
        if (existingStatutEvenement.code === code && existingStatutEvenement.libelleFr === libelleFr && existingStatutEvenement.libelleEn === libelleEn) {
            return res.json({
                success: true,
                message: message.donne_a_jour,
                data: existingStatutEvenement,
            });
        }

        //vérifier si le code existe déjà or mis le code de l'élément en cours de modification
        if (existingStatutEvenement.code !== code) {
            const existingCode = await Setting.findOne({ 'statutEvenement.code': code });
            if (existingCode) {
                return res.status(400).json({
                    success: false,
                    message: message.existe_code
                });
            }
        }
        //vérifier si le libelle fr existe déjà or mis le libelle fr de l'élément en cours de modification
        if (existingStatutEvenement.libelleFr !== libelleFr) {
            const existingLibelleFr = await Setting.findOne({ 'statutEvenement.libelleFr': libelleFr });
            if (existingLibelleFr) {
                return res.status(400).json({
                    success: false,
                    message: message.existe_libelle_fr
                });
            }
        }
        //vérifier si le libelle en existe déjà or mis le libelle en de l'élément en cours de modification
        if (existingStatutEvenement.libelleEn !== libelleEn) {
            const existingLibelleEn = await Setting.findOne({ 'statutEvenement.libelleEn': libelleEn });
            if (existingLibelleEn) {
                return res.status(400).json({
                    success: false,
                    message: message.existe_libelle_en
                });
            }
        }

        const updatedStatutEvenement = { ...existingStatutEvenement };

        // Mettre à jour les champs modifiés
        updatedStatutEvenement.code = code;
        updatedStatutEvenement.libelleFr = libelleFr;
        updatedStatutEvenement.libelleEn = libelleEn;

        // Mettre à jour le statutevenement dans la base de données
        await Setting.updateOne(
            { "statutEvenement._id": new mongoose.Types.ObjectId(id) }, // Trouver le statutevenement par son ID
            { $set: { "statutEvenement.$": updatedStatutEvenement } } // Mettre à jour le statutevenement
        );

        // Envoyer la réponse avec les données mises à jour
        return res.json({
            success: true,
            message: message.mis_a_jour,
            data: updatedStatutEvenement,
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
export const deleteStatutEvenement = async (req, res) => {
    const { id } = req.params;

    try {
        // Vérifier si id est un ObjectId valide
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide,
            });
        }

        const setting = await Setting.findOneAndUpdate({}, { $pull: { statutEvenement: { _id: new mongoose.Types.ObjectId(id) } } }, { new: true });

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


