import mongoose, { Schema } from 'mongoose';

const calendarSchema = new Schema({
    libelle: { type: String, required: true },

});

const Calendars = mongoose.model('Calendar', calendarSchema, 'calendars');

export default Calendars;
