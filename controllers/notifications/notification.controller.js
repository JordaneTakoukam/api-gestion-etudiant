import mongoose from "mongoose";
import Notification from '../../models/notification.model.js';
import NotificationReadStatus from '../../models/absences/notification_read.model.js';
import multer from 'multer';
import path from 'path';
import { io } from "../../server.js";
import { DateTime } from 'luxon';
import { appConfigs } from '../../configs/app_configs.js';
import { message } from "../../configs/message.js";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/documents/pieces_jointes/');
    },
    filename: function (req, file, cb) {
        const extension = path.extname(file.originalname);
        const timestamp = DateTime.now().toFormat('X');
        const fileName = `${timestamp}-${file.originalname}`;
        cb(null, fileName);
    }
});

const upload = multer({ storage });

export const createNotification = [
    upload.array('files'),
    async (req, res) => {
        const {
            type,
            user,
            role,
            enseignant,
            motif,
            heure_debut_absence,
            heure_fin_absence,
            jour_absence,
            niveau,
            semestre,
            annee,
            chapitre,
            objectif
        } = req.body;

        try {
            const parsedUser = JSON.parse(user);
            const parsedEns = enseignant && JSON.parse(enseignant);
            const parsedChap = chapitre && JSON.parse(chapitre);
            const parsedObj = objectif && JSON.parse(objectif);
            if (!mongoose.Types.ObjectId.isValid(parsedUser._id)) {
                return res.status(400).json({
                    success: false,
                    message:message.identifiant_user_invalide,
                });
            }

            // Vérifier si l'ID de l'enseignant est valide
            if (parsedEns && !mongoose.Types.ObjectId.isValid(parsedEns._id)) {
                return res.status(400).json({
                    success: false,
                    message: message.identifiant_ens_invalide,
                });
            }

            // Vérifier si l'ID du chapitre est valide
            if (parsedChap && !mongoose.Types.ObjectId.isValid(parsedChap._id)) {
                return res.status(400).json({
                    success: false,
                    message: message.identifiant_invalide,
                });
            }
            // Vérifier si l'ID de l'objectif est valide
            if (parsedObj && !mongoose.Types.ObjectId.isValid(parsedObj._id)) {
                return res.status(400).json({
                    success: false,
                    message: message.identifiant_invalide,
                });
            }

            if (!role || !['etudiant', 'enseignant'].includes(role)) {
                return res.status(404).json({ success: false, message: message.invalid_role });
            }
            const enseignantId = parsedEns ? parsedEns._id : undefined;
            const chapitreId = parsedChap ? parsedChap._id : undefined;
            const objectifId = parsedObj ? parsedObj._id : undefined;

            // Création de la notification
            const notification = new Notification({
                type,
                role,
                user:parsedUser._id,
                enseignant: enseignantId,
                chapitre:chapitreId,
                objectif:objectifId,
                motif,
                heure_debut_absence,
                heure_fin_absence,
                jour_absence,
                semestre,
                annee,
                niveau
            });

            // Enregistrement des fichiers joints
            if (req.files && req.files.length > 0) {
                const filePaths = req.files.map(file => `/private/documents/pieces_jointes/${file.filename}`);
                notification.filePaths = filePaths;
            }

            const savedNotification = await notification.save();
            const populateNotification = await Notification.populate(savedNotification, [
                { path: 'user', select: '_id nom prenom' }, 
                { path: 'chapitre', select: '_id libelleFr libelleEn matiere',  populate: {path: 'matiere',select: '_id libelleFr libelleEn' }, options: { strictPopulate: false }}, 
                { path: 'objectif', select: '_id libelleFr libelleEn matiere',  populate: {path: 'matiere',select: '_id libelleFr libelleEn' }, options: { strictPopulate: false }}, 
            ]);
            // Émettre la notification via Socket.IO
            const dataReturn = {
                ...populateNotification._doc
            };
            io.emit('message', dataReturn);

            res.status(201).json({
                success: true,
                message: { fr: 'Envoie réussi', en: 'Send successful' },
                data: dataReturn
            });
        } catch (error) {
            console.error("Erreur lors de la création de la notification :", error);
            res.status(500).json({ success: false, message: message.erreurServeur });
        }
    }
];

export const getUserNotifications = async (req, res) => {
    const userId = req.params.userId;
    const { niveauxId, role, annee, semestre } = req.query;

    try {
        let notifications = [];

        if (niveauxId && niveauxId.length > 0) {
            if (role === appConfigs.role.enseignant) {
                const allNotifications = await Notification.find({
                    user: { $ne: userId },
                    type:appConfigs.typeNotifications.absence,
                    niveau: { $in: niveauxId },
                    annee: annee,
                    semestre: semestre,
                }).populate('user', '_id nom prenom')
                    .populate('signalementAbsence');

                allNotifications.forEach(notification => {
                    if (!notification.enseignant) {
                        notifications.push(notification);
                    } else {
                        if (notification.enseignant.toString() === userId.toString()) {
                            notifications.push(notification);
                        }
                    }
                });
            } else if (role === appConfigs.role.delegue) {
                notifications = await Notification.find({
                    user: { $ne: userId },
                    type:appConfigs.typeNotifications.absence,
                    niveau: { $in: niveauxId },
                    annee: annee,
                    semestre: semestre,
                }).populate('user', '_id nom prenom')
                .populate('signalementAbsence');
            } else if (role === appConfigs.role.etudiant) {
                notifications = await Notification.find({
                    user: { $ne: userId },
                    role: appConfigs.role.enseignant,
                    type:appConfigs.typeNotifications.absence,
                    niveau: { $in: niveauxId },
                    annee: annee,
                    semestre: semestre,
                }).populate('user', '_id nom prenom')
                .populate('signalementAbsence');
            }
        } else {
            notifications = await Notification.find({
                annee: annee,
                semestre: semestre,
            }).populate('user', '_id nom prenom')
              .populate({path:'signalementAbsence', options: { strictPopulate: false }})
              .populate({
                  path: 'objectif',
                  select: '_id libelleFr libelleEn matiere',
                    populate: {
                        path: 'matiere',
                        select: '_id libelleFr libelleEn'
                    },
                    options: { strictPopulate: false }

              })
              .populate({
                  path: 'chapitre',
                  select: '_id libelleFr libelleEn matiere',
                  populate: {
                      path: 'matiere',
                      select: '_id libelleFr libelleEn'
                  },
                  options: { strictPopulate: false }
              });
        }

        const readStatuses = await NotificationReadStatus.find({ user: userId });

        // Marquer les notifications lues
        const notificationsWithReadStatus = notifications.map(notification => {
            const status = readStatuses.find(status => status.notification.toString() === notification._id.toString());
            return {
                ...notification.toObject(),
                read: status ? status.read : false
            };
        }).filter(notification => !notification.read);

        res.status(200).json({ success: true, data: notificationsWithReadStatus });
    } catch (error) {
        console.error('Erreur lors de la récupération des notifications :', error);
        res.status(500).json({ success: false, message: message.erreurServeur, error: error.message });
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
        res.status(200).json({ success: true, message: { fr: 'Notification marquée comme lue', en: 'Notification marked as read' } });
    } catch (error) {
        console.error('Erreur lors de la mise à jour de la notification :', error);
        res.status(500).json({ success: false, message: { fr: 'Erreur lors de la mise à jour de la notification', en: 'Error updating notification' }, error: error.message });
    }
};

export const markAllNotificationAsRead = async (req, res) => {
    const { notificationIds, userId } = req.body;
    try {
        if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
            return res.status(400).json({ success: false, message: { fr: 'Liste des notifications invalide', en: 'Invalid notification list' } });
        }

        // Utiliser bulkWrite pour effectuer les opérations en masse
        const bulkOps = notificationIds.map(notificationId => ({
            updateOne: {
                filter: { notification: notificationId, user: userId },
                update: { $set: { read: true } },
                upsert: true
            }
        }));

        await NotificationReadStatus.bulkWrite(bulkOps);

        res.status(200).json({ success: true, message: { fr: 'Notifications marquées comme lues', en: 'Notifications marked as read' } });
    } catch (error) {
        console.error('Erreur lors de la mise à jour des notifications :', error);
        res.status(500).json({ success: false, message: { fr: 'Erreur lors de la mise à jour des notifications', en: 'Error updating notifications' }, error: error.message });
    }
};

