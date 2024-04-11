import nodemailer from 'nodemailer';
import { appConfigs } from '../configs/app_configs.js';

export const sendEmailConfirmation = async (email, confirmationText) => {

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
      <p>${confirmationText}</p>
      <p>Cordialement, L'équipe de ${appConfigs.appName}. <a href="${appConfigs.frontEndUrl}" target="_blank">${appConfigs.frontEndUrl}</a></p>
    </div>
  `;

    try {
        const mailOptions = {
            from: `"${appConfigs.appName}" <${appConfigs.appEmail}>`,
            to: email,
            subject: "Confirmation",
            html: emailTemplate(),
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('E-mail envoyé avec succès:', info.response);
    } catch (error) {
        console.error("Erreur lors de l'envoi de l'e-mail:", error);
    }
};
