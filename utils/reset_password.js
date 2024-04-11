import nodemailer from 'nodemailer';
import { appConfigs } from '../configs/app_configs.js';


export const sendPasswordResetEmail = async (name, email, verificationCode) => {

  let transporter = nodemailer.createTransport({
    service: 'gmail',
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: appConfigs.user,
      pass: appConfigs.pass,
    },
  });

  const emailTemplate = () => `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Réinitialisation de mot de passe - ${appConfigs.appName}</title>
      <style>
        /* Styles CSS pour l'e-mail */
      </style>
    </head>
    <body>
      <div class="container">
        <p>Bonjour ${name},</p>
        <p>Votre code de vérification pour réinitialiser le mot de passe est : <strong>${verificationCode}</strong></p>
        <p>Ce code est valide pendant 24 heures.</p>
        <p>Utilisez ce code dans l'application pour procéder à la réinitialisation.</p>
        <p>Si vous n'avez pas demandé de réinitialisation de mot de passe, vous pouvez ignorer cet e-mail en toute sécurité.</p>
        <p>Cordialement, L'équipe de ${appConfigs.appName}. <a href="${appConfigs.frontEndUrl}" target="_blank">${appConfigs.frontEndUrl}</a></p>
        </div>
    </body>
    </html>
  `;

  try {
    const mailOptions = {
      from: `"${appConfigs.appName}" <${appConfigs.appEmail}>`,
      to: email,
      subject: "Réinitialisation de mot de passe",
      html: emailTemplate(),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('E-mail envoyé avec succès:', info.response);
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'e-mail:", error);
  }
};
