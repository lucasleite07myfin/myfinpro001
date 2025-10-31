interface EmployeeInviteEmailProps {
  employeeEmail: string;
  companyName: string;
  inviteUrl: string;
  expiresAt: string;
  department?: string;
  position?: string;
}

export function generateEmployeeInviteEmail({
  employeeEmail,
  companyName,
  inviteUrl,
  expiresAt,
  department,
  position,
}: EmployeeInviteEmailProps): string {
  const expirationDate = new Date(expiresAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const positionDepartmentSection = (position || department) ? `
    <div style="background-color: #f8f9fa; border-left: 4px solid #0066cc; padding: 16px 20px; margin: 24px 0; border-radius: 4px;">
      ${position ? `<p style="color: #333333; font-size: 15px; line-height: 22px; margin: 8px 0;"><strong>Cargo:</strong> ${position}</p>` : ''}
      ${department ? `<p style="color: #333333; font-size: 15px; line-height: 22px; margin: 8px 0;"><strong>Setor:</strong> ${department}</p>` : ''}
    </div>
  ` : '';

  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Convite para ${companyName}</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #f6f9fc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;">
    <div style="background-color: #ffffff; margin: 0 auto; padding: 40px 20px; border-radius: 8px; max-width: 600px;">
      <h1 style="color: #1a1a1a; font-size: 28px; font-weight: bold; margin: 0 0 20px; padding: 0; text-align: center;">🎉 Bem-vindo!</h1>
      
      <p style="color: #333333; font-size: 16px; line-height: 24px; margin: 16px 0;">
        Olá, <strong>${employeeEmail}</strong>!
      </p>

      <p style="color: #333333; font-size: 16px; line-height: 24px; margin: 16px 0;">
        Você foi convidado para fazer parte da equipe de <strong>${companyName}</strong> no sistema de gestão financeira.
      </p>

      ${positionDepartmentSection}

      <div style="text-align: center; margin: 32px 0;">
        <a href="${inviteUrl}" style="background-color: #0066cc; border-radius: 6px; color: #ffffff; font-size: 16px; font-weight: bold; text-decoration: none; text-align: center; display: inline-block; padding: 14px 32px;">
          Aceitar Convite
        </a>
      </div>

      <p style="color: #666666; font-size: 14px; line-height: 20px; margin: 24px 0 8px; text-align: center;">
        Ou copie e cole este link no seu navegador:
      </p>
      <p style="color: #0066cc; font-size: 13px; line-height: 20px; word-break: break-all; text-align: center; margin: 0 0 24px;">
        ${inviteUrl}
      </p>

      <hr style="border: none; border-top: 1px solid #e6e6e6; margin: 32px 0;">

      <p style="color: #666666; font-size: 14px; line-height: 20px; margin: 12px 0;">
        ⚠️ <strong>Importante:</strong> Este convite expira em ${expirationDate}.
      </p>

      <p style="color: #666666; font-size: 14px; line-height: 20px; margin: 12px 0;">
        Se você não esperava este convite, pode ignorar este email com segurança.
      </p>

      <p style="color: #333333; font-size: 15px; line-height: 22px; margin: 24px 0 0; font-style: italic;">
        Atenciosamente,<br>
        Equipe ${companyName}
      </p>
    </div>
  </body>
</html>
  `;
}
