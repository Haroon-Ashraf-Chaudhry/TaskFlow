const nodemailer = require('nodemailer');

const createTransport = () => nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.mailtrap.io',
  port: process.env.EMAIL_PORT || 587,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

exports.sendInviteEmail = async ({ to, workspaceName, inviteCode, inviterName }) => {
  try {
    const transport = createTransport();
    await transport.sendMail({
      from: process.env.EMAIL_FROM || 'TaskFlow <noreply@taskflow.app>',
      to,
      subject: `${inviterName} invited you to ${workspaceName} on TaskFlow`,
      html: `
        <h2>You've been invited!</h2>
        <p>${inviterName} invited you to join <strong>${workspaceName}</strong> on TaskFlow.</p>
        <p>Use invite code: <strong>${inviteCode}</strong></p>
        <a href="${process.env.CLIENT_URL}/join/${inviteCode}" style="background:#6366f1;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;">Accept Invitation</a>
      `,
    });
  } catch (err) {
    console.error('Email error:', err.message);
  }
};

exports.sendPasswordResetEmail = async ({ to, resetUrl }) => {
  try {
    const transport = createTransport();
    await transport.sendMail({
      from: process.env.EMAIL_FROM || 'TaskFlow <noreply@taskflow.app>',
      to,
      subject: 'Password Reset - TaskFlow',
      html: `
        <h2>Reset your password</h2>
        <p>Click below to reset your password. This link expires in 1 hour.</p>
        <a href="${resetUrl}" style="background:#6366f1;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;">Reset Password</a>
      `,
    });
  } catch (err) {
    console.error('Email error:', err.message);
  }
};

exports.sendTaskAssignedEmail = async ({ to, taskTitle, projectName, taskUrl }) => {
  try {
    const transport = createTransport();
    await transport.sendMail({
      from: process.env.EMAIL_FROM || 'TaskFlow <noreply@taskflow.app>',
      to,
      subject: `New task assigned: ${taskTitle}`,
      html: `
        <h2>You've been assigned a task</h2>
        <p>Task: <strong>${taskTitle}</strong> in <strong>${projectName}</strong></p>
        <a href="${taskUrl}" style="background:#6366f1;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;">View Task</a>
      `,
    });
  } catch (err) {
    console.error('Email error:', err.message);
  }
};
