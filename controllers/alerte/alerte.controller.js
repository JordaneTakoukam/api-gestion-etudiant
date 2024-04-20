import { message } from "../../configs/message.js";
import { DateTime } from "luxon";

import mongoose from 'mongoose';
import User from "../../models/user.model.js";
import Alerte from "../../models/alerte.model.js";

// Contrôleur pour récupérer la liste des alertes pour un utilisateur donné
export const recupererAlertesParUser = async (req, res) => {
    const { userId } = req.params;

    try {
        // Vérifier si l'ID de l'utilisateur est un ObjectId valide
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ success: false, message: message.identifiant_invalide });
        }

        // Vérifier si l'utilisateur existe
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: message.userNonTrouver });
        }

        // Récupérer la liste des alertes pour cet utilisateur
        const alertes = await Alerte.find({ userId });

        res.status(200).json({ success: true, data: alertes });
    } catch (error) {
        console.error("Erreur lors de la récupération des alertes :", error);
        res.status(500).json({ success: false, message: message.erreurServeur });
    }
};



// Contrôleur pour ajouter une alerte
export const ajouterAlerte = async (req, res) => {
    const { userId, messageFr, messageEn } = req.body;

    try {
        // Vérifier si l'ID de l'utilisateur est un ObjectId valide
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ success: false, message: message.identifiant_invalide });
        }

        // Vérifier si l'utilisateur existe
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: message.userNonTrouver });
        }

        // Créer une nouvelle alerte
        const nouvelleAlerte = new Alerte({
            message: { fr: messageFr, en: messageEn },
            userId
        });

        // Enregistrer l'alerte dans la base de données
        const alerteEnregistree = await nouvelleAlerte.save();

        res.status(201).json({ success: true, message: message.alert_ajouter_success, data: alerteEnregistree });
    } catch (error) {
        console.error("Erreur lors de l'ajout de l'alerte :", error);
        res.status(500).json({ success: false, message: message.erreurServeur });
    }
};

// Contrôleur pour supprimer une alerte
export const supprimerAlerte = async (req, res) => {
    const { alerteId } = req.params;

    try {
        // Vérifier si l'ID de l'alerte est un ObjectId valide
        if (!mongoose.Types.ObjectId.isValid(alerteId)) {
            return res.status(400).json({ success: false, message: message.identifiant_invalide });
        }

        // Vérifier si l'alerte existe
        const alerte = await Alerte.findById(alerteId);
        if (!alerte) {
            return res.status(404).json({ success: false, message: message.alert_non_trouver });
        }

        // Supprimer l'alerte de la base de données
        await Alerte.findByIdAndDelete(alerteId);

        res.status(200).json({ success: true, message: message.alert_supprimer_sucess });
    } catch (error) {
        console.error("Erreur lors de la suppression de l'alerte :", error);
        res.status(500).json({ success: false, message: message.erreurServeur });
    }
};
