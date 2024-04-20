import mongoose from 'mongoose';

const { Schema } = mongoose;

const alertSchema = new Schema({
    message: {
        fr: { type: String, required: true },
        en: { type: String, required: true }
    },
    // userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    dateCreation: { type: Date, default: Date.now }
});

const Alerte = mongoose.model('Alerte', alertSchema, "alertes");

export default Alerte;
