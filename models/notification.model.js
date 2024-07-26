import mongoose, { Schema } from 'mongoose';
import { validRoles } from './user.model.js';

const notificationSchema = new Schema({
    //Caractéristique commune à toute les notifications
    type: { type: String, required: true }, // Type de notification (e.g., 'absence', 'approbation_chapitre', approbation_objectif ...)
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Utilisateur associé à la notification
    role: { type: String, enum: validRoles, required: true },
    date_creation: { type: Date, default: Date.now }, // Date de création de la notification
    read: { type: Boolean, default: false }, // Indicateur si la notification a été lue ou non
    

    //Caratéristique propre à demande d'approbation des chapitres
    chapitre: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapitre', required: false },

     //Caratéristique propre à demande d'approbation des objectifs
    objectif: { type: mongoose.Schema.Types.ObjectId, ref: 'Objectif', required: false },
    
    //Caratéristique propre à la notification d'absence
    signalementAbsence: { type: mongoose.Schema.Types.ObjectId, ref: 'SignalementAbsence', required: false },
    
});

const Notification = mongoose.model('Notification', notificationSchema, 'notifications');

export default Notification;
