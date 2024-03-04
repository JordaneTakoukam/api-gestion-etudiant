import mongoose, { Schema } from 'mongoose';

const scheduleSchema = new Schema({
    libelle: { type: String, required: true },

});

const Schedules = mongoose.model('Shedule', scheduleSchema, 'schedules'); // emploi de temps

export default Schedules;
