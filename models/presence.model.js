import mongoose, { Schema } from 'mongoose';

const presenceSchema = new Schema({
  enseignant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  matiere: { type: mongoose.Schema.Types.ObjectId, ref: 'Matiere', required: true },
  niveau:{ type: mongoose.Schema.Types.ObjectId, ref: 'Niveau', required: true },
  annee:{type:Number, required:true},
  semestre:{type:Number, required:true},
  jour: { type: Number, required: true }, // Jour de la semaine (ex: 1=Lundi, 2=Mardi, etc.)
  heureDebut: { type: String, required:true},
  heureFin: { type: String, required:true},
  dateEnregistrement: { type: Date, default: Date.now },
  totalHoraire:{type:Number, required:false}
});

const Presence = mongoose.model('Presence', presenceSchema, 'presences'); 

export default Presence;
