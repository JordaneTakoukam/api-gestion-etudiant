import mongoose, { Schema } from 'mongoose';


const NotificationReadStatusSchema = new Schema({
    notification: { type: mongoose.Schema.Types.ObjectId, ref: 'SignalementAbsence', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    read: { type: Boolean, default: false }
});


const NotificationReadStatus = mongoose.model('NotificationReadStatus', NotificationReadStatusSchema, 'notificationReadStatuses');

export default NotificationReadStatus;

