import mongoose, { Schema } from 'mongoose';

const evenementSchema = new Schema({
    code:{type:String, required:true},
    libelleFr: { type: String, required: true },
    libelleEn: { type: String, required: true },
    dateDebut:{type:Date, required:true},
    dateFin:{type:Date, required:true},
    periodeFr:{type:String, required:true},
    periodeEn:{type:String, required:true},
    etat: { type: mongoose.Schema.Types.ObjectId, ref: 'EtatEvenement', required: true },
    personnelFr:{type:String, required:false},
    personnelEn:{type:String, required:false},
    descriptionObservationFr:{type:String, required:false},
    descriptionObservationEn:{type:String, required:false},
    date_creation:{type:String, required:true},
    annee:{type:Number, required:true}
});

const Evenement = mongoose.model('Evenement', evenementSchema, 'evenements');

export default Evenement;
