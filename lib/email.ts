// Email service for sending notifications using Gmail via Nodemailer
import nodemailer from "nodemailer";

interface EmailAttachment {
  filename: string;
  content: string | Buffer;
  contentType?: string;
}

interface EmailParams {
  to: string;
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
}

// Create transporter with Gmail
const createTransporter = () => {
  // Check if Gmail credentials are configured
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn(
      "⚠️ Gmail credentials not configured. Emails will be logged only."
    );
    return null;
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
};

export async function sendEmail({
  to,
  subject,
  html,
  attachments,
}: EmailParams) {
  const transporter = createTransporter();

  // If no transporter (credentials not set), just log
  if (!transporter) {
    if (attachments && attachments.length > 0) {
      }
    return { success: true, mode: "development" };
  }

  try {
    // Send actual email
    const info = await transporter.sendMail({
      from: `"Projections System" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
      attachments: attachments || [],
    });

    return { success: true, messageId: info.messageId, mode: "production" };
  } catch (error: any) {
    console.error("❌ Error sending email:", error.message);
    // Fallback to logging if email fails
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

export function generateApprovalRequestEmail({
  userName,
  projectName,
  projectionName,
  approvalLink,
}: {
  userName: string;
  projectName: string;
  projectionName: string;
  approvalLink: string;
}) {
  return {
    subject: `Approval Request: ${projectionName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #8B7FC8; color: white; padding: 20px; text-align: center; }
            .content { background: #f9f9f9; padding: 30px; border: 2px solid #6B8E23; }
            .button { 
              display: inline-block; 
              background: #FF8C42; 
              color: white; 
              padding: 12px 30px; 
              text-decoration: none; 
              border-radius: 5px;
              margin: 20px 0;
            }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Approval Request</h1>
            </div>
            <div class="content">
              <p>Hi ${userName},</p>
              <p>You have been requested to review and approve a projection:</p>
              <ul>
                <li><strong>Project:</strong> ${projectName}</li>
                <li><strong>Projection:</strong> ${projectionName}</li>
              </ul>
              <p>Please review the projection and provide your approval or feedback.</p>
              <center>
                <a href="${approvalLink}" class="button">Review Projection</a>
              </center>
              <p>If the button doesn't work, copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #8B7FC8;">${approvalLink}</p>
            </div>
            <div class="footer">
              <p>This is an automated message from the Projections system.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}

export function generateProjectionShareEmail({
  userName,
  senderName,
  projectName,
  projectionName,
  viewLink,
  message,
}: {
  userName: string;
  senderName: string;
  projectName: string;
  projectionName: string;
  viewLink: string;
  message?: string;
}) {
  return {
    subject: `New Projection Created: ${projectionName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #8B7FC8; color: white; padding: 20px; text-align: center; }
            .content { background: #f9f9f9; padding: 30px; border: 2px solid #6B8E23; }
            .button { 
              display: inline-block; 
              background: #FF8C42; 
              color: white; 
              padding: 12px 30px; 
              text-decoration: none; 
              border-radius: 5px;
              margin: 20px 0;
            }
            .message-box { 
              background: white; 
              border-left: 4px solid #8B7FC8; 
              padding: 15px; 
              margin: 15px 0;
            }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📊 New Projection Created</h1>
            </div>
            <div class="content">
              <p>Hi ${userName},</p>
              <p>A new projection has been created for <strong>${projectName}</strong>.</p>
              <ul>
                <li><strong>Projection:</strong> ${projectionName}</li>
                <li><strong>Created by:</strong> ${senderName}</li>
              </ul>
              ${
                message
                  ? `<div class="message-box">
                <p><strong>Message from ${senderName}:</strong></p>
                <p>${message}</p>
              </div>`
                  : ""
              }
              <p>Please sign into the app to review and approve or deny this projection.</p>
              <p><strong>📎 A CSV file containing the projection data is attached to this email.</strong></p>
              <center>
                <a href="${viewLink}" class="button">Sign In & Review Projection</a>
              </center>
              <p>If the button doesn't work, copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #8B7FC8;">${viewLink}</p>
            </div>
            <div class="footer">
              <p>This is an automated message from the Projections system.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}
