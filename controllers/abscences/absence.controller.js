import { message } from "../../configs/message.js";
import Absence from "../../models/absence.model.js";
import User from "../../models/user.model.js";
import mongoose from "mongoose";

// Messages en français
const messagesFr = {
    absence_inexistante: "L'absence n'existe pas pour cet utilisateur",
    erreur_ajout_absence: "Erreur serveur lors de l'ajout de l'absence à l'utilisateur",
    erreur_retrait_absence: "Erreur serveur lors du retrait de l'absence de l'utilisateur",
    absence_ajoutee_succes: "Absence ajoutée à l'utilisateur avec succès",
    absence_retiree_succes: "Absence retirée de l'utilisateur avec succès"
};

// Messages en anglais
const messagesEn = {
    absence_inexistante: "Absence does not exist for this user",
    erreur_ajout_absence: "Server error while adding absence to user",
    erreur_retrait_absence: "Server error while removing absence from user",
    absence_ajoutee_succes: "Absence added to user successfully",
    absence_retiree_succes: "Absence removed from user successfully"
};

// Contrôleur pour ajouter une absence à un utilisateur
export const ajouterAbsence = async (req, res) => {
    const userId = req.params.userId;
    const { semestre, annee, dateAbsence, heureDebut, heureFin } = req.body;

    try {
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide,
            });
        }

        // Vérifier si l'utilisateur existe
        const utilisateur = await User.findById(userId);
        if (!utilisateur) {
            return res.status(404).json({ success: false, message: message.userNonTrouver });
        }

        // Créer une nouvelle instance de l'absence avec les données fournies
        const nouvelleAbsence = new Absence({
            semestre,
            annee,
            dateAbsence,
            heureDebut,
            heureFin,
            user:userId
        });

        // Enregistrer l'absence dans la base de données
        const absenceEnregistree = await nouvelleAbsence.save();

        // Ajouter l'ID de l'absence à la liste des absences de l'utilisateur
        utilisateur.absences.push(absenceEnregistree._id);

        // Enregistrer les modifications de l'utilisateur
        await utilisateur.save();

        res.status(201).json({ success: true, message: { fr: messagesFr.absence_ajoutee_succes, en: messagesEn.absence_ajoutee_succes }, data: absenceEnregistree });
    } catch (error) {
        console.error("Erreur lors de l'ajout de l'absence à l'utilisateur :", error);
        res.status(500).json({ success: false, message: { fr: messagesFr.erreur_ajout_absence, en: messagesEn.erreur_ajout_absence } });
    }
};



// Contrôleur pour retirer une absence à un utilisateur
export const retirerAbsence = async (req, res) => {
    const userId = req.params.userId;
    const absenceId = req.params.absenceId;

    try {

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: message.userNotFound,
            });
        }

        if (!mongoose.Types.ObjectId.isValid(absenceId)) {
            return res.status(400).json({
                success: false,
                message: message.absence_invalide,
            });
        }
        // Vérifier si l'utilisateur existe
        const utilisateur = await User.findById(userId);
        if (!utilisateur) {
            return res.status(404).json({ success: false, message: message.userNonTrouver });
        }

        // Vérifier si l'absence existe dans la liste des absences de l'utilisateur
        if (!utilisateur.absences.includes(absenceId)) {
            return res.status(404).json({ success: false, message: { fr: messagesFr.absence_inexistante, en: messagesEn.absence_inexistante } });
        }

        // Retirer l'ID de l'absence de la liste des absences de l'utilisateur
        utilisateur.absences = utilisateur.absences.filter(id => id.toString() !== absenceId);

        // Enregistrer les modifications de l'utilisateur
        await utilisateur.save();

        // Supprimer l'absence de la base de données
        await Absence.findByIdAndDelete(absenceId);

        res.status(200).json({ success: true, message: { fr: messagesFr.absence_retiree_succes, en: messagesEn.absence_retiree_succes } });
    } catch (error) {
        console.error("Erreur lors du retrait de l'absence de l'utilisateur :", error);
        res.status(500).json({ success: false, message: { fr: messagesFr.erreur_retrait_absence, en: messagesEn.erreur_retrait_absence } });
    }
};



