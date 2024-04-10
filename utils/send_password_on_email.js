import nodemailer from 'nodemailer';
import { appConfigs } from '../configs/app_configs.js';

export const sendPasswordOnEmail = async (name, email, password) => {

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
    <div>
      <p>Bonjour ${name},</p>
      <p>La création de votre compte à été éffectuer avec succès</p>
      <p>Votre mot de passe pour vous connecter à l'application est : <strong>${password}</strong></p>
      <p>Cordialement, L'équipe de ${appConfigs.appName}. <a href="${appConfigs.frontEndUrl}" target="_blank">${appConfigs.frontEndUrl}</a></p>
      </div>
  `;

    try {
        const mailOptions = {
            from: `"${appConfigs.appName}" <${appConfigs.appEmail}>`,
            to: email,
            subject: "Création de compte avec succès",
            html: emailTemplate(),
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('E-mail envoyé avec succès:', info.response);
    } catch (error) {
        console.error("Erreur lors de l'envoi de l'e-mail:", error);
    }
};
