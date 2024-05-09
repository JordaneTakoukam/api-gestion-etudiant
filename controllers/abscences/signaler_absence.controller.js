import { message } from "../../configs/message.js";
import mongoose from "mongoose";
import SignalementAbsence from "../../models/absences/signaler_absence.model.js";
import User, { validRoles } from "../../models/user.model.js";
import { io } from "../../server.js";

// Contrôleur pour signaler une absence
export const signalerAbsence = async (req, res) => {
    const { userId, role, motif, titre, description, date_debut_absence, date_fin_absence, } = req.body;

    try {
        // Vérifier si l'ID de l'user est valide
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide,
            });
        }

        // Rechercher l'user dans la base de données
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: message.userNonTrouver });
        }

        if (!role || !validRoles.includes(role)) {
            return res.status(404).json({ success: false, message: 'Rôle invalide' });
        }

        // Créer le signalement d'absence
        const nouveauSignalement = new SignalementAbsence({
            role: role,
            userId: userId,
            motif,
            titre,
            description,
            date_debut_absence,
            date_fin_absence,
        });


        // Enregistrer le signalement d'absence dans la base de données
        await nouveauSignalement.save();

        const dataReturn = {
            nom: user.nom,
            prenom: user.prenom,
            userId: nouveauSignalement.userId,

            role: nouveauSignalement.role,

            motif: nouveauSignalement.motif,
            titre: nouveauSignalement.titre,
            description: nouveauSignalement.description,

            date_creation: nouveauSignalement.date_creation,
            date_debut_absence: nouveauSignalement.date_debut_absence,
            date_fin_absence: nouveauSignalement.date_fin_absence,
        }

        io.emit("message", { message: dataReturn });


        // Répondre avec les informations de signalement d'absence
        res.status(201).json({
            success: true,
            message: 'success',
            data: dataReturn,
        });
    } catch (error) {
        console.error("Erreur lors de la signalisation de l'absence :", error);
        res.status(500).json({ success: false, message: message.erreurServeur });
    }
};
