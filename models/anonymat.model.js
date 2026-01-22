import mongoose, { Schema } from 'mongoose';

/**
 * Modèle pour gérer les numéros d'anonymat
 * Chaque étudiant reçoit un numéro unique par évaluation
 * Le lien étudiant-anonymat est strictement confidentiel
 */
const anonymatSchema = new Schema({
    // L'évaluation concernée
    evaluation: { type: mongoose.Schema.Types.ObjectId, ref: 'Evaluation', required: true },
    
    // L'étudiant (CONFIDENTIEL - accès restreint)
    etudiant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    
    // Le numéro d'anonymat (visible par les enseignants)
    numeroAnonymat: { type: String, required: true, unique: true},
    
    // Niveau de l'étudiant au moment de l'évaluation
    niveau: { type: mongoose.Schema.Types.ObjectId, ref: 'Niveau', required: true },
    
    // Date de génération
    dateGeneration: { type: Date, default: Date.now },
    
    // Statut de l'anonymat
    statut: {type: String, enum: ['ACTIF', 'UTILISE', 'ANNULE'], default: 'ACTIF'},
    
    // Utilisé (a des notes saisies)
    utilise: { type: Boolean, default: false },
    
    // Invalidé (en cas de fraude, abandon, etc.)
    invalide: { type: Boolean, default: false },
    
    raisonInvalidation: { type: String, required: false },
    
    dateInvalidation: { type: Date, required: false },
    
    invalidePar: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false }
}, {
    timestamps: true
});

// Index composé pour garantir l'unicité par évaluation
anonymatSchema.index({ evaluation: 1, etudiant: 1 }, { unique: true });
anonymatSchema.index({ numeroAnonymat: 1 }, { unique: true });
anonymatSchema.index({ evaluation: 1, statut: 1 });

// Méthode pour générer un numéro d'anonymat unique
anonymatSchema.statics.genererNumeroAnonymat = async function(evaluationId, prefixe = 'AN') {
    const annee = new Date().getFullYear();
    let numeroTrouve = false;
    let numeroAnonymat = '';
    
    while (!numeroTrouve) {
        // Génère un numéro aléatoire de 6 chiffres
        const numeroAleatoire = Math.floor(100000 + Math.random() * 900000);
        numeroAnonymat = `${prefixe}${annee}-${numeroAleatoire}`;
        
        // Vérifie si ce numéro existe déjà
        const existe = await this.findOne({ numeroAnonymat });
        if (!existe) {
            numeroTrouve = true;
        }
    }
    
    return numeroAnonymat;
};

const Anonymat = mongoose.model('Anonymat', anonymatSchema, 'anonymats');

export default Anonymat;