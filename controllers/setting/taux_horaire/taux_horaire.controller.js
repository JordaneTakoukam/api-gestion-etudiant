import Setting from '../../../models/setting.model.js';
import { message } from '../../../configs/message.js';
import { DateTime } from 'luxon';
import mongoose from 'mongoose';

// create


export const createTauxHoraire = async (req, res) => {
    const { tauxHoraire } = req.body;

    try {
        // Vérifier si l'année est présente dans la requête
        if (!tauxHoraire) {
            return res.status(400).json({
                success: false,
                message: message.champ_obligatoire
            });
        }

        // Vérifier si la collection "Setting" existe
        let setting = await Setting.findOne();

        if (!setting) {
            // Si la collection n'existe pas, créer un nouveau document avec l'année courante
            setting = new Setting({ tauxHoraire: tauxHoraire });
        } else {
            // Si la collection existe, mettre à jour l'année courante
            setting.tauxHoraire = tauxHoraire;
        }

        // Enregistrer ou mettre à jour le document dans la base de données
        const savedSetting = await setting.save();

        res.json({
            success: true,
            message: message.ajouter_avec_success,
            data: savedSetting.tauxHoraire
        });
    } catch (error) {
        console.error("Erreur interne au serveur :", error);
        res.status(500).json({
            success: false,
            message: "Erreur interne au serveur"
        });
    }
}


export const updateTauxHoraire = async (req, res) => {
    const { tauxHoraire } = req.body;

    try {
        // Vérifier si l'année est présente dans la requête
        if (!tauxHoraire) {
            return res.status(400).json({
                success: false,
                message: message.champ_obligatoire
            });
        }

        // Vérifier si la collection "Setting" existe
        let setting = await Setting.findOne();

        if (!setting) {
            // Si la collection n'existe pas, créer un nouveau document avec l'année courante
            setting = new Setting({ tauxHoraire: tauxHoraire });
        } else {
            // Si la collection existe, mettre à jour l'année courante
            setting.tauxHoraire = tauxHoraire;
        }

        // Enregistrer ou mettre à jour le document dans la base de données
        const savedSetting = await setting.save();

        res.json({
            success: true,
            message: message.mis_a_jour,
            data: savedSetting.tauxHoraire
        });
    } catch (error) {
        console.error("Erreur interne au serveur :", error);
        res.status(500).json({
            success: false,
            message: "Erreur interne au serveur"
        });
    }
}
// delete
export const deleteTauxHoraire = async (req, res) => {
    const { id } = req.params;

    try {
        // Vérifier si id est un ObjectId valide
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide,
            });
        }

        const setting = await Setting.findOneAndUpdate({}, { $pull: { tauxHoraire: { _id: new mongoose.Types.ObjectId(id) } } }, { new: true });

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


