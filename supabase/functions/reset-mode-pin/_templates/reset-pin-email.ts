export const generateResetPinEmail = (params: {
  userName: string;
  resetUrl: string;
  expiresAt: string;
}) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">Redefinição de PIN</h1>
          </div>
          
          <div style="padding: 40px 30px;">
            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
              Olá <strong>${params.userName}</strong>,
            </p>
            
            <p style="color: #555555; font-size: 15px; line-height: 1.6; margin: 0 0 30px 0;">
              Recebemos uma solicitação para redefinir seu PIN de alternância de modos. 
              Clique no botão abaixo para criar um novo PIN:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${params.resetUrl}" 
                 style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 6px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);">
                Redefinir meu PIN
              </a>
            </div>
            
            <p style="color: #888888; font-size: 13px; line-height: 1.5; margin: 30px 0 10px 0; text-align: center;">
              Este link expira em <strong>15 minutos</strong> (${params.expiresAt})
            </p>
            
            <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 30px 0;">
              <p style="color: #856404; font-size: 14px; line-height: 1.5; margin: 0;">
                <strong>⚠️ Atenção:</strong> Se você não solicitou esta redefinição de PIN, ignore este e-mail. 
                Seu PIN permanecerá inalterado.
              </p>
            </div>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e9ecef;">
            <p style="color: #6c757d; font-size: 12px; line-height: 1.5; margin: 0;">
              © ${new Date().getFullYear()} MyFin. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
};
