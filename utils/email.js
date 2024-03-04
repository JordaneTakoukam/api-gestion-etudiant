// utils/email.js
import nodemailer from 'nodemailer';


// a configurer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: '',
        pass: ''
    },
});

// Fonction pour envoyer un e-mail
export const sendEmail = async (to, subject, content) => {

};
