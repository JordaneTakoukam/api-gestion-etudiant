import nodemailer from 'nodemailer';

const user = `suport.resetpass@gmail.com`;
const pass = "nyxsjvahaavoilbg";

// Fonction pour envoyer un e-mail avec le code de vérification
export const sendVerificationCodeByEmail = async (name, email, code) => {
    // Configurez votre transporteur SMTP avec Nodemailer
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
            user: user,
            pass: pass,
        },
    });

    // Stylisation de l'e-mail
    const emailTemplate = () => `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Confirmation d'inscription - Monsieur Le Bailleur</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 0;
          background-color: #fff;
        }
        .container {
          padding: 10px 40px; 
          max-width: 450px;
          margin: 0 auto;
          border: 1px solid #ddd;
          border-radius: 10px;
        }
        .code {
          font-size: 20px;
          font-weight: bold;
          text-align: center;
          margin-bottom: 15px;
          background-color: #f7f7f7;
          padding: 6px 10px;
          border-radius: 5px;
          color: black; /* Couleur noire pour les titres */
        }
        .message {
          font-size: 16px;
          line-height: 1.5;
          text-align: center;
          color: #888; /* Couleur gris pour les messages */
        }
        .footer {
          text-align: center;
          margin-top: 20px;
          font-size: 14px;
          color: #aaa;
        }
        p {
          font-size: 13px;
        }
        h1 {
          font-size: 25px;
          margin-bottom: 30px;
          text-align: center;
          color: black; /* Couleur noire pour les titres */
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Confirmation d'inscription</h1>
        <p style="color: black; text-align: center;">Bonjour ${name}</p> <!-- Bonjour en noir -->
        <p class="message">Pour finaliser votre inscription, veuillez utiliser le code de confirmation suivant :</p>
        <p class="code">${code}</p>
        <p class="message">Ce code est valable pendant 24 heures.</p>
        <p class="footer">Cordialement,<br/>L'équipe de Monsieur Le Bailleur<br/><a href="https://www.monsieur-le-bailleur.com/" target="_blank">www.monsieur-le-bailleur.com</a></p>
      </div>
    </body>
    </html>
    
    `;



    // Envoyer l'e-mail avec le code de vérification
    try {
        const mailOptions = {
            from: '"Monsieur le bailleur" <contact@monsieur-le-bailleur.com>',
            to: email,
            subject: "Confirmation de votre inscription",
            html: emailTemplate(),
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('E-mail envoyé avec succès:', info.response);
    } catch (error) {
        console.error("Erreur lors de l'envoi de l'e-mail:", error);
    }
};

