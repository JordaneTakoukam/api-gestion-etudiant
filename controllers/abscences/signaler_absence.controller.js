import { message } from "../../configs/message.js";
import mongoose from "mongoose";
import SignalementAbsence from "../../models/absences/signaler_absence.model.js";
import NotificationReadStatus from "../../models/absences/notification_read.model.js";
import User, { validRoles } from "../../models/user.model.js";
import { io } from "../../server.js";
import Setting from '../../models/setting.model.js';
import { appConfigs } from "../../configs/app_configs.js";
import { DateTime } from 'luxon';

// Contrôleur pour signaler une absence
export const signalerAbsence = async (req, res) => {
    const {
        user,
        enseignant,
        role,
        // motif,
        // titre, 
        // description,
        heure_debut_absence,
        heure_fin_absence,
        jour_absence,

        niveau,
        semestre,
        annee
    } = req.body;

    try {
        // Vérifier si l'ID de l'user est valide
        if (!mongoose.Types.ObjectId.isValid(user._id)) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide,
            });
        }

        // Vérifier si l'ID de l'enseignant est valide
        if (enseignant && !mongoose.Types.ObjectId.isValid(enseignant._id)) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide,
            });
        }

        // Rechercher l'user dans la base de données
        // const user = await User.findById(userId).select('_id nom prenom');
        // if (!user) {
        //     return res.status(404).json({ success: false, message: message.userNonTrouver });
        // }

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
        const date_absence_signaler = DateTime.now().toJSDate();
        const nouvelleAbsenceSignaler = new SignalementAbsence({
            role,
            user:user._id,
            enseignant:enseignant._id,
            heure_debut_absence,
            heure_fin_absence,
            jour_absence,
            date_absence_signaler,
            semestre,
            annee,
            niveau
        });


        // Enregistrer le signalement d'absence dans la base de données
        const nouvelleAbsence = await nouvelleAbsenceSignaler.save();

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

export const getUserNotifications = async (req, res) => {
    const userId = req.params.userId;
    const { niveauxId, role, annee, semestre } = req.query;

    try {
        let absences=[];
        if(niveauxId && niveauxId.length>0){
            if(role===appConfigs.role.enseignant ){
                absences = await SignalementAbsence.find({
                    user: { $ne: userId },
                    enseignant:userId,
                    niveau: { $in: niveauxId },
                    annee: annee,
                    semestre: semestre,
                    date_absence_signaler: { $gte: jour }
                }).populate('user', '_id nom prenom');
            }else if( role===appConfigs.role.delegue){
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
        const readStatuses = await NotificationReadStatus.find({ user: userId });

        // Marquer les notifications lues
        const notificationsWithReadStatus = absences.map(notification => {
            const status = readStatuses.find(status => status.notification.toString() === notification._id.toString());
            return {
                ...notification.toObject(),
                read: status ? status.read : false
            };
        });

        res.status(200).json({ success: true, data: notificationsWithReadStatus });
    } catch (error) {
        console.error('Erreur lors de la récupération des notifications :', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la récupération des notifications', error: error.message });
    }
};

export const markNotificationAsRead = async (req, res) => {
    const { notificationId, userId } = req.body;

    try {
        let status = await NotificationReadStatus.findOne({ notification: notificationId, user: userId });

        if (!status) {
            status = new NotificationReadStatus({ notification: notificationId, user: userId, read: true });
        } else {
            status.read = true;
        }

        await status.save();
        res.status(200).json({ success: true, message: 'Notification marquée comme lue' });
    } catch (error) {
        console.error('Erreur lors de la mise à jour de la notification :', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour de la notification', error: error.message });
    }
};



export const getAbsencesSignaler = async (req, res) => {
    const {userId}=req.params;
    const { niveauxId, role, annee, semestre } = req.query;
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
        // let settings = await Setting.find().select('anneeCourante semestreCourant');
        // let setting = null;
        // if(settings.length>0){
        //     setting=settings[0]
        // }
        // let annee;
        // let semestre;
        // if(setting){
        //     annee=setting.anneeCourante;
        //     semestre=setting.semestreCourant;
        // }
        // if(role===appConfigs.role.enseignant){

        // }
        const result = await User.findOne({_id:userId}).select('historique_connexion');
        if (result && result.historique_connexion.length > 0) {
            const length = result.historique_connexion.length;
            const jour=result.historique_connexion[length-2];
            let absences=[];
            if(niveauxId && niveauxId.length>0){
                if(role===appConfigs.role.enseignant ){
                    absences = await SignalementAbsence.find({
                        user: { $ne: userId },
                        enseignant:userId,
                        niveau: { $in: niveauxId },
                        annee: annee,
                        semestre: semestre,
                        date_absence_signaler: { $gte: jour }
                    }).populate('user', '_id nom prenom');
                }else if( role===appConfigs.role.delegue){
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

