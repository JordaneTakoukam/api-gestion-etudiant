import mongoose, { Schema } from 'mongoose';

const subjectSchema = new Schema({
    libelle: { type: String, required: true },


    chapters: []

});

const Subjects = mongoose.model('Subject', subjectSchema, 'subjects'); // matieres

export default Subjects;
