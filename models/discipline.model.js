import mongoose, { Schema } from 'mongoose';

/**
 * Modèle pour gérer les notes de discipline
 * Les notes de discipline sont attribuées directement aux étudiants (pas d'anonymat)
 */
const disciplineSchema = new Schema({
    // L'évaluation concernée
    evaluation: { type: mongoose.Schema.Types.ObjectId, ref: 'Evaluation', required: true },
    
    // L'étudiant (directement visible, pas d'anonymat pour la discipline)
    etudiant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    
    // La note de discipline saisie
    note: { type: Number, required: true, min: 0 },
    
    // Note sur combien (généralement 20)
    noteMax: { type: Number, default: 20 },
    
    // Appréciations
    appreciationFr: { type: String, required: false },
    
    appreciationEn: { type: String, required: false },
    
    // Détails des manquements à la discipline
    manquements: [{
        type: {
            type: String,
            enum: [
                'RETARD',
                'ABSENCE_INJUSTIFIEE',
                'TENUE_INCORRECTE',
                'COMPORTEMENT_INAPPROPRIE',
                'NON_RESPECT_REGLEMENT',
                'PERTURBATION_COURS',
                'FRAUDE',
                'AUTRE'
            ]
        },
        description: { type: String },
        date: { type: Date },
        pointsRetires: { type: Number, default: 0 }
    }],
    
    // Points bonus (comportement exemplaire, participation, etc.)
    bonus: [{
        motif: { type: String },
        description: { type: String },
        date: { type: Date },
        pointsAjoutes: { type: Number, default: 0 }
    }],
    
    // Responsable ayant saisi la note
    saisiePar: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    
    // Dates
    dateSaisie: { type: Date, default: Date.now },
    
    dateModification: { type: Date, required: false },
    
    modifiePar: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
    
    // Statut de la note
    statut: {
        type: String,
        enum: ['BROUILLON', 'SAISIE', 'VALIDEE', 'PUBLIEE', 'VERROUILLEE'],
        default: 'SAISIE'
    },
    
    // Validation
    validee: { type: Boolean, default: true },
    
    dateValidation: { type: Date, required: false },
    
    valideePar: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
    
    // Publication
    publiee: { type: Boolean, default: false },
    
    datePublication: { type: Date, required: false },
    
    // Verrouillage
    verrouillee: { type: Boolean, default: false },
    
    dateVerrouillage: { type: Date, required: false },
    
    // Historique des modifications
    historique: [{
        ancienneNote: { type: Number },
        nouvelleNote: { type: Number },
        modifiePar: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'User' 
        },
        dateModification: { 
            type: Date, 
            default: Date.now 
        },
        raison: { type: String }
    }]
}, {
    timestamps: true
});

// Index pour garantir l'unicité et optimiser les recherches
disciplineSchema.index({ evaluation: 1, etudiant: 1 }, { unique: true });
disciplineSchema.index({ etudiant: 1, statut: 1 });
disciplineSchema.index({ saisiePar: 1 });

const Discipline = mongoose.model('Discipline', disciplineSchema, 'disciplines');

export default Discipline;