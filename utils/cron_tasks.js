import cron from 'node-cron';
import Setting from '../models/setting.model.js';
import Periode from '../models/periode.model.js';
import { enregistrerAbsencesApresCours } from '../controllers/abscences/absence.controller.js';
import moment from 'moment-timezone';

// Planifier le cron job pour qu'il s'exécute à 18h chaque jour du lundi au vendredi
cron.schedule('23 11 * * 1-5', async () => {
    console.log("Exécution du cron à 18h pour l'enregistrement des absences.");
    
    try {
        // Récupérer tous les niveaux
        let settings = await Setting.find().select('niveaux anneeCourante semestreCourant');
        let setting = settings.length > 0 ? settings[0] : null;

        const niveaux = setting?.niveaux || [];
        const anneeCourante = setting.anneeCourante || 2023;
        const semestreCourant = setting.semestreCourant || 1;

        // Obtenir le jour actuel en utilisant le fuseau horaire de Douala, Cameroun
        const jourCameroun = moment().tz("Africa/Douala").day();  // 0=Dimanche, 1=Lundi, ..., 6=Samedi
        
        // Boucler sur tous les niveaux
        for (const niveau of niveaux) {

            // Récupérer toutes les périodes pour ce niveau, ce jour, et dont l'attribut pause est false
            const filter = {
                niveau: niveau._id,
                annee : anneeCourante,
                semestre : semestreCourant,
                jour : jourCameroun,
                pause : false
                
            };


            // Récupérer les périodes qui correspondent au filtre
            const periodes = await Periode.find(filter);
            if (periodes.length === 0) {
                console.log(`Aucune période trouvée pour le niveau ${niveau._id} le jour ${jourCameroun}.`);
                continue;  // Passer au niveau suivant si aucune période n'est trouvée
            }

            // // Enregistrer les absences en parallèle pour toutes les périodes
            const absencesPromises = periodes.map(async (periode) => {
                // Appeler la méthode pour enregistrer les absences pour ce niveau et cette matière
                const result = await enregistrerAbsencesApresCours(
                    niveau._id,
                    periode.matiere,
                    periode.annee,
                    periode.semestre,
                    jourCameroun,  // Utiliser le jour correspondant au Cameroun
                    periode.heureDebut,
                    periode.heureFin
                );
                console.log(`Absences enregistrées pour la matière ${periode.matiere} du niveau ${niveau._id}`);
            });

            // Attendre que toutes les promesses d'enregistrement soient résolues
            await Promise.all(absencesPromises);
        }

        console.log("Enregistrement des absences terminé.");
    } catch (error) {
        console.error("Erreur lors de l'enregistrement des absences pour tous les niveaux :", error);
    }
});
