// Email service for sending notifications
// You can integrate with services like Resend, SendGrid, or Nodemailer

interface EmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailParams) {
  // For development, just log the email
  // In production, integrate with your email service
  console.log("📧 Email would be sent:");
  console.log("To:", to);
  console.log("Subject:", subject);
  console.log("Body:", html);

  // Example with Resend (uncomment when you have API key):
  // const { Resend } = require('resend');
  // const resend = new Resend(process.env.RESEND_API_KEY);
  //
  // await resend.emails.send({
  //   from: 'noreply@yourdomain.com',
  //   to,
  //   subject,
  //   html,
  // });

  return { success: true };
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
