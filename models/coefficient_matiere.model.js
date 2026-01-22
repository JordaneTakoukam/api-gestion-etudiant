import mongoose, { Schema } from 'mongoose';

/**
 * Modèle pour gérer les coefficients des matières
 * Les coefficients peuvent être paramétrés par année académique et par semestre
 */
const coefficientMatiereSchema = new Schema({
    matiere: { type: mongoose.Schema.Types.ObjectId, ref: 'Matiere', required: true },
    
    niveau: { type: mongoose.Schema.Types.ObjectId, ref: 'Niveau', required: true },
    
    // Année académique (ex: 2024)
    annee: { type: Number, required: true },
    
    // Semestre (1, 2 ou 3 selon le niveau)
    // Niveau 1 : semestres 1 et 2
    // Niveau 2 : semestre 3
    semestre: { type: Number, required: true, enum: [1, 2, 3],
        validate: {
            validator: function(value) {
                // Validation personnalisée sera faite au niveau du contrôleur
                // car elle dépend du niveau
                return [1, 2, 3].includes(value);
            },
            message: 'Le semestre doit être 1, 2 ou 3'
        }
    },
    
    // Le coefficient de la matière pour cette période
    coefficient: {  type: Number, required: true, default: 1},
    
    // Date de création
    dateCreation: {type: Date, default: Date.now},
    
    // Date de dernière modification
    dateModification: {type: Date, default: Date.now},
    
    // Utilisateur ayant créé/modifié
    modifiePar: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false}
}, {
    timestamps: true
});

// Index composé pour éviter les doublons
coefficientMatiereSchema.index(
    { matiere: 1, niveau: 1, annee: 1, semestre: 1 }, 
    { unique: true }
);

const CoefficientMatiere = mongoose.model('CoefficientMatiere', coefficientMatiereSchema, 'coefficients_matieres');

export default CoefficientMatiere;