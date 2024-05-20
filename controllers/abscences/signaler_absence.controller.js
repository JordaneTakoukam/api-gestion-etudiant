import { message } from "../../configs/message.js";
import mongoose from "mongoose";
import SignalementAbsence from "../../models/absences/signaler_absence.model.js";
import User, { validRoles } from "../../models/user.model.js";
import { io } from "../../server.js";
import Setting from '../../models/setting.model.js';
import { appConfigs } from "../../configs/app_configs.js";

// Contrôleur pour signaler une absence
export const signalerAbsence = async (req, res) => {
    const {
        userId,
        role,
        // motif,
        // titre, 
        // description,
        heure_debut_absence,
        heure_fin_absence,
        jour_absence,
        date_absence_signaler,

        niveau,
        semestre,
        annee
    } = req.body;

    try {
        // Vérifier si l'ID de l'user est valide
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide,
            });
        }

        // Rechercher l'user dans la base de données
        const user = await User.findById(userId).select('_id nom prenom');
        if (!user) {
            return res.status(404).json({ success: false, message: message.userNonTrouver });
        }

        if (!role || !validRoles.includes(role)) {
            return res.status(404).json({ success: false, message: 'Rôle invalide' });
        }

        // Créer le signalement d'absence
        // const nouveauSignalement = new SignalementAbsence({
        // role: role,
        // userId: userId,
        //     motif,
        //     titre,
        //     description,
        //     date_debut_absence,
        //     date_fin_absence,
        // });

        const nouvelleAbsenceSignaler = new SignalementAbsence({
            role,
            user,
            heure_debut_absence,
            heure_fin_absence,
            jour_absence,
            date_absence_signaler,
            semestre,
            annee,
            niveau
        });


        // Enregistrer le signalement d'absence dans la base de données
        // const nouvelleAbsence = await nouvelleAbsenceSignaler.save();

        const dataReturn = {
            // nom: user.nom,
            // prenom: user.prenom,
            // userId: nouvelleAbsenceSignaler.userId,
            // role:role,
            // niveau:niveau

            ...nouvelleAbsenceSignaler._doc
        }

        io.emit("message", { message: dataReturn });


        // Répondre avec les informations de signalement d'absence
        return res.status(201).json({
            success: true,
            message: 'success',
            data: dataReturn,
        });
    } catch (error) {
        console.error("Erreur lors de la signalisation de l'absence :", error);
        res.status(500).json({ success: false, message: message.erreurServeur });
    }
};

export const getAbsencesSignaler = async (req, res) => {
    const {userId}=req.params;
    const { niveauxId, role } = req.query;
    console.log(niveauxId);
    // console.log(userId+" "+semestre+" "+annee)
    try {
        // Rechercher les absences de l'utilisateur correspondant au semestre et à l'année
        // const result = await User.aggregate([
        //     { $match: { _id:userId } },
        //     { $project: { 
        //         historique_connexion: { $slice: ["$historique_connexion", -1] } 
        //     }}
        //   ]);
        let settings = await Setting.find().select('anneeCourante semestreCourant');
        let setting = null;
        if(settings.length>0){
            setting=settings[0]
        }
        let annee;
        let semestre;
        if(setting){
            annee=setting.anneeCourante;
            semestre=setting.semestreCourant;
        }
        // if(role===appConfigs.role.enseignant){

        // }
        const result = await User.findOne({_id:userId}).select('historique_connexion');
        if (result && result.historique_connexion.length > 0) {
            const length = result.historique_connexion.length;
            const jour=result.historique_connexion[length-2];
            let absences=[];
            if(niveauxId && niveauxId.length>0){
                if(role===appConfigs.role.enseignant || role===appConfigs.role.delegue){
                    absences = await SignalementAbsence.find({
                        user: { $ne: userId },
                        niveau: { $in: niveauxId },
                        annee: annee,
                        semestre: semestre,
                        date_absence_signaler: { $gte: jour }
                    }).populate('user', '_id nom prenom');
                }else if(role===appConfigs.role.etudiant){
                    absences = await SignalementAbsence.find({
                        role:appConfigs.role.enseignant,
                        niveau: { $in: niveauxId },
                        annee: annee,
                        semestre: semestre,
                        date_absence_signaler: { $gte: jour }
                    }).populate('user', '_id nom prenom');
                }
            }else{
                absences = await SignalementAbsence.find({
                    annee: annee,
                    semestre: semestre,
                    date_absence_signaler: { $gte: jour }
                }).populate('user', '_id nom prenom');
            }
            
            
            res.json({
                success: true,
                data: {
                    absences: absences
                }
            });
        } 
       
    } catch (error) {
        console.error("Erreur interne au serveur :", error);
        res.status(500).json({
            success: false,
            message: "Erreur interne au serveur."
        });
    }
};

