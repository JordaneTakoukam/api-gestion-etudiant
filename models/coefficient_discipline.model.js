import mongoose, { Schema } from 'mongoose';

/**
 * Modèle pour gérer les coefficients de discipline
 * Les coefficients peuvent être paramétrés par année académique et par semestre
 */
const coefficientDisciplineSchema = new Schema({
    niveau: { type: mongoose.Schema.Types.ObjectId, ref: 'Niveau', required: true },
    
    // Année académique (ex: 2024)
    annee: { type: Number, required: true },
    
    // Semestre (1, 2 ou 3 selon le niveau)
    semestre: { 
        type: Number, 
        required: true, 
        enum: [1, 2, 3],
        validate: {
            validator: function(value) {
                return [1, 2, 3].includes(value);
            },
            message: 'Le semestre doit être 1, 2 ou 3'
        }
    },
    
    // Le coefficient de la discipline pour cette période
    coefficient: { 
        type: Number, 
        required: true, 
        default: 1,
        min: 0.5,
        max: 5
    },
    
    // Date de création
    dateCreation: { type: Date, default: Date.now },
    
    // Date de dernière modification
    dateModification: { type: Date, default: Date.now },
    
    // Utilisateur ayant créé/modifié
    modifiePar: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false }
}, {
    timestamps: true
});

// Index composé pour éviter les doublons
coefficientDisciplineSchema.index(
    { niveau: 1, annee: 1, semestre: 1 }, 
    { unique: true }
);

const CoefficientDiscipline = mongoose.model('CoefficientDiscipline', coefficientDisciplineSchema, 'coefficients_discipline');

export default CoefficientDiscipline;