import nodemailer from "nodemailer";

let transporter;

const getTransporter = () => {
  if (process.env.EMAIL_ENABLED !== "true") {
    return null;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      connectionTimeout: 4000,
      greetingTimeout: 4000,
      socketTimeout: 5000,
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT || 587),
      secure: Number(process.env.EMAIL_PORT || 587) === 465,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  return transporter;
};

export const sendStatusChangeEmail = async ({ to, ticketTitle, status }) => {
  const transport = getTransporter();

  if (!transport || !to) {
    return;
  }

  await transport.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: `Ticket status updated: ${ticketTitle}`,
    text: `Your complaint "${ticketTitle}" is now marked as "${status}".`,
  });
};
