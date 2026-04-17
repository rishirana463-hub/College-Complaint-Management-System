import nodemailer from "nodemailer";

const isEmailEnabled = process.env.EMAIL_ENABLED === "true";

let transporter;

const getTransporter = () => {
  if (!isEmailEnabled) {
    return null;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT || 587),
      secure: false,
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
