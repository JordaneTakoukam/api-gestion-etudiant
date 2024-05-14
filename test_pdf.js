import { create } from 'html-pdf';
import { readFile } from 'fs';

// Fonction pour charger le contenu HTML du fichier dans une chaîne
function loadHTML(filePath) {
    return new Promise((resolve, reject) => {
        readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
}

// Fonction pour générer le PDF à partir du contenu HTML
function generatePDFfromHTML(filePath, outputPath) {
    loadHTML(filePath)
        .then(htmlContent => {
            const options = {
                format: 'Letter', // Format de page
                border: {
                    top: '1in',    // Marge supérieure
                    right: '1in',  // Marge droite
                    bottom: '1in', // Marge inférieure
                    left: '1in'    // Marge gauche
                }
            };

            create(htmlContent, options).toFile(outputPath, (err, res) => {
                if (err) return console.log(err);
                console.log('PDF generated successfully:', res);
            });
        })
        .catch(error => {
            console.error('Error loading HTML file:', error);
        });
}

// Usage
const htmlFilePath = 'templates/template.html';
const outputPath = 'output.pdf';
generatePDFfromHTML(htmlFilePath, outputPath);
