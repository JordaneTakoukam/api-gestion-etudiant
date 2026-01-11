import mongoose, { Schema } from 'mongoose';

/**
 * Modèle pour gérer les notes
 * Les notes sont saisies par anonymat et rattachées aux étudiants après délibération
 */
const noteSchema = new Schema({
    // L'évaluation concernée
    evaluation: { type: mongoose.Schema.Types.ObjectId, ref: 'Evaluation', required: true},
    
    // La matière concernée
    matiere: { type: mongoose.Schema.Types.ObjectId, ref: 'Matiere', required: true},
    
    // L'anonymat utilisé pour la saisie
    anonymat: { type: mongoose.Schema.Types.ObjectId, ref: 'Anonymat', required: true },
    
    // L'étudiant (rempli automatiquement après délibération)
    etudiant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
    
    // La note saisie
    note: { type: Number, required: true,min: 0
    },
    
    // Note sur combien (généralement 20)
    noteMax: { type: Number, default: 20},
    
    // Appréciation de l'enseignant
    appreciationFr: { type: String, required: false },
    
    appreciationEn: {type: String, required: false},
    
    // Enseignant ayant saisi la note
    saisiePar: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
    
    // Dates
    dateSaisie: { type: Date, default: Date.now},
    
    dateModification: { type: Date, required: false},
    
    modifiePar: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false},
    
    // Statut de la note
    statut: {type: String, enum: ['BROUILLON', 'SAISIE', 'VALIDEE', 'PUBLIEE', 'VERROUILLEE'], default: 'SAISIE'},
    
    // Validation
    validee: { type: Boolean, default: false},
    
    dateValidation: {type: Date, required: false},
    
    valideePar: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false},
    
    // Publication
    publiee: { type: Boolean, default: false},
    
    datePublication: { type: Date, required: false},
    
    // Verrouillage
    verrouillee: {type: Boolean, default: false },
    
    dateVerrouillage: { type: Date, required: false},
    
    // Absence à l'épreuve
    absent: {type: Boolean, default: false},
    
    // Fraude
    fraude: { type: Boolean, default: false },
    
    detailsFraude: { type: String, required: false},
    
    // Copie blanche
    copieBlanche: {type: Boolean, default: false},
    
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
noteSchema.index({ evaluation: 1, matiere: 1, anonymat: 1 }, { unique: true });
noteSchema.index({ evaluation: 1, matiere: 1, etudiant: 1 });
noteSchema.index({ etudiant: 1, statut: 1 });
noteSchema.index({ saisiePar: 1 });

// Méthode pour calculer la moyenne d'un étudiant pour une évaluation
noteSchema.statics.calculerMoyenne = async function(evaluationId, etudiantId) {
    const notes = await this.find({ 
        evaluation: evaluationId, 
        etudiant: etudiantId,
        statut: { $in: ['VALIDEE', 'PUBLIEE', 'VERROUILLEE'] },
        absent: false
    }).populate('matiere');
    
    if (notes.length === 0) return null;
    
    // Récupérer les coefficients
    const CoefficientMatiere = mongoose.model('CoefficientMatiere');
    
    let sommeNotes = 0;
    let sommeCoefficients = 0;
    
    for (const note of notes) {
        // Trouver le coefficient de la matière
        const evaluation = await mongoose.model('Evaluation').findById(evaluationId);
        const matiereEval = evaluation.matieres.find(
            m => m.matiere.toString() === note.matiere._id.toString()
        );
        
        if (matiereEval) {
            const coefficient = matiereEval.coefficient;
            sommeNotes += note.note * coefficient;
            sommeCoefficients += coefficient;
        }
    }
    
    return sommeCoefficients > 0 ? sommeNotes / sommeCoefficients : null;
};

const Note = mongoose.model('Note', noteSchema, 'notes');

export default Note;