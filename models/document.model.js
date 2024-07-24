import mongoose, { Schema } from 'mongoose';

const documentSchema = new Schema({
    nomFr: { type: String, required: true },
    nomEn: { type: String, required: true },    
    date_creation:{type:String, required:true},
    file_path: { type: String, required: true }
});

const Document = mongoose.model('Document', documentSchema, 'documents');

export default Document;
