import { message } from "../../configs/message.js";
import Absence from "../../models/absences/absence.model.js";
import Presence from "../../models/presence.model.js";
import User from "../../models/user.model.js";
import mongoose from "mongoose";
import moment from 'moment-timezone';


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
            user:userId,
            etat:0,
            motif:"",
        });

        // Enregistrer l'absence dans la base de données
        const absenceEnregistree = await nouvelleAbsence.save();

        // Ajouter l'ID de l'absence à la liste des absences de l'utilisateur
        utilisateur.absences.push(absenceEnregistree._id);

        // Enregistrer les modifications de l'utilisateur
        await utilisateur.save();

        res.status(201).json({ success: true, message: message.absence_ajoutee_succes});
    } catch (error) {
        console.error("Erreur lors de l'ajout de l'absence à l'utilisateur :", error);
        res.status(500).json({ success: false, message: message.erreur_ajout_absence });
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
            return res.status(404).json({ success: false, message: message.absence_inexistante });
        }

        // Retirer l'ID de l'absence de la liste des absences de l'utilisateur
        utilisateur.absences = utilisateur.absences.filter(id => id.toString() !== absenceId);

        // Enregistrer les modifications de l'utilisateur
        await utilisateur.save();

        // Supprimer l'absence de la base de données
        await Absence.findByIdAndDelete(absenceId);

        res.status(200).json({ success: true, message: message.absence_retiree_succes });
    } catch (error) {
        console.error("Erreur lors du retrait de l'absence de l'utilisateur :", error);
        res.status(500).json({ success: false, message: message.erreur_retrait_absence });
    }
};

// Contrôleur pour retirer une absence à un utilisateur
export const justifierAbsence = async (req, res) => {
    
    const {motif="", etat=1, _id}=req.body;

    try {

        if (!mongoose.Types.ObjectId.isValid(_id)) {
            return res.status(400).json({
                success: false,
                message: message.absence_invalide,
            });
        }
        // Vérifier si l'utilisateur existe
        const absence = await Absence.findById(_id);
        if (!absence) {
            return res.status(404).json({ success: false, message: message.absence_inexistante });
        }
        absence.motif=motif;
        absence.etat=etat;
        // Supprimer l'absence de la base de données
        await absence.save();

        res.json({
            success: true,
            message: message.mis_a_jour,
            data: absence,
        });
    } catch (error) {
        console.error("Erreur lors du retrait de l'absence de l'utilisateur :", error);
        res.status(500).json({ success: false, message: message.erreur_retrait_absence });
    }
};

export const enregistrerAbsencesApresCours = async (niveauId, matiereId, annee, semestre, jour, heureDebut, heureFin) => {
    try {
        
        const query = {
            'niveaux': {
                $elemMatch: {
                    niveau: niveauId,
                    annee: Number(annee),
                },
            },
        };
        // Récupérer tous les étudiants inscrits dans le niveau concerné
        const etudiants = await User.find(query);

        // Parcourir la liste des étudiants
        for (const etudiant of etudiants) {
            // Vérifier si l'étudiant a déjà enregistré sa présence pour ce cours
            const presenceExistante = await Presence.findOne({
                utilisateur: etudiant._id,
                matiere: matiereId,
                niveau: niveauId,
                annee,
                semestre,
                jour,
                debutCours:true,
                finCours:true
            });

            // Si pas de présence enregistrée, marquer une absence
            if (!presenceExistante) {
                const nouvelleAbsence = new Absence({
                    user: etudiant._id,
                    semestre,
                    annee,
                    dateAbsence: new Date(),
                    heureDebut,
                    heureFin,
                    etat: 0, // Statut indiquant l'absence
                    motif: '',
                });

                // Sauvegarder l'absence
                await nouvelleAbsence.save();

                // Ajouter cette absence dans le champ `absences` de l'étudiant
                etudiant.absences.push(nouvelleAbsence._id);
                await etudiant.save();
            }
        }

        return { success: true, message: "Absences enregistrées avec succès." };

    } catch (error) {
        console.error("Erreur lors de l'enregistrement des absences :", error);
        return { success: false, message: "Erreur lors de l'enregistrement des absences." };
    }
};



