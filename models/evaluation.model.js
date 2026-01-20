import mongoose, { Schema } from 'mongoose';

/**
 * Modèle pour gérer les évaluations
 * Une évaluation peut concerner plusieurs matières
 */
const evaluationSchema = new Schema({
    // Informations générales
    libelleFr: { type: String, required: true },
    
    libelleEn: { type: String,  required: true },
    
    descriptionFr: {type: String, required: false},
    
    descriptionEn: {type: String, required: false},
    
    // Type d'évaluation
    type: {
        type: String,
        enum: ['CONTROLE_CONTINU', 'EXAMEN_PARTIEL', 'EXAMEN_FINAL', 'SESSION_RATTRAPAGE', 'AUTRE'],
        default: 'CONTROLE_CONTINU'
    },
    
    // Période
    niveau: { type: mongoose.Schema.Types.ObjectId, ref: 'Niveau', required: true },
    
    annee: { type: Number, required: true},
    
    semestre: { type: Number, required: true, enum: [1, 2, 3],
        validate: {
            validator: function(value) {
                return [1, 2, 3].includes(value);
            },
            message: 'Le semestre doit être 1, 2 ou 3'
        }
    },
    
    // Matières concernées par cette évaluation
    // Chaque matière conserve son coefficient
    matieres: [{
        matiere: { type: mongoose.Schema.Types.ObjectId, ref: 'Matiere', required: true },
        // Coefficient spécifique pour cette évaluation (récupéré depuis CoefficientMatiere)
        coefficient: { type: Number, required: true }
    }],

    coefficientDiscipline: { 
        type: Number, 
        required: true,
        default: 1
    },
    
    // Dates
    dateCreation: { type: Date, default: Date.now},
    
    dateEpreuve: { type: Date, required: false },
    
    dateLimiteSaisie: { type: Date, required: false },
    
    dateDeliberation: { type: Date, required: false },
    
    datePublication: { type: Date, required: false },
    
    // États de l'évaluation
    statut: {
        type: String,
        enum: ['BROUILLON', 'PROGRAMMEE', 'EN_COURS', 'CORRECTION', 'DELIBERATION', 'PUBLIEE', 'VERROUILEE'],
        default: 'BROUILLON'
    },
    
    // Anonymats générés automatiquement
    anonymatsGeneres: { type: Boolean, default: false },
    
    dateGenerationAnonymats: { type: Date, required: false },
    
    // Verrouillage des notes
    notesVerrouillees: { type: Boolean, default: false },
    
    dateVerrouillage: {  type: Date, required: false},
    
    verrouillePar: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
    
    // Créateur
    creePar: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    
    // Barème
    noteMax: { type: Number, default: 20 },
    
    noteMin: { type: Number, default: 0 }
}, {
    timestamps: true
});

// Index pour recherches fréquentes
evaluationSchema.index({ niveau: 1, annee: 1, semestre: 1 });
evaluationSchema.index({ statut: 1 });
evaluationSchema.index({ dateEpreuve: 1 });

const Evaluation = mongoose.model('Evaluation', evaluationSchema, 'evaluations');

export default Evaluation;