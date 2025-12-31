import nodemailer from "nodemailer";

// Configuration du transporteur
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

const FROM_EMAIL =
  process.env.FROM_EMAIL || "RenovScout <noreply@renovscout.com>";
const APP_NAME = "RenovScout";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: SendEmailOptions) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    console.log("[Email] SMTP not configured, skipping email send");
    console.log("[Email] Would send to:", options.to);
    console.log("[Email] Subject:", options.subject);
    return { success: true, data: null };
  }

  try {
    const info = await transporter.sendMail({
      from: FROM_EMAIL,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    console.log("[Email] Sent successfully to:", options.to);
    console.log("[Email] Message ID:", info.messageId);
    return { success: true, data: info };
  } catch (error) {
    console.error("[Email] Failed to send:", error);
    return { success: false, error };
  }
}

// Vérifier la connexion SMTP au démarrage
export async function verifyEmailConnection(): Promise<boolean> {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    console.log("[Email] SMTP not configured");
    return false;
  }

  try {
    await transporter.verify();
    console.log("[Email] SMTP connection verified");
    return true;
  } catch (error) {
    console.error("[Email] SMTP connection failed:", error);
    return false;
  }
}

// ============================================
// EMAIL TEMPLATES
// ============================================

const baseStyles = `
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1a1a1a; background-color: #f5f5f5; margin: 0; padding: 0; }
  .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
  .header { background: linear-gradient(135deg, #d97706 0%, #ea580c 100%); padding: 40px 30px; text-align: center; }
  .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; }
  .header p { color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 14px; }
  .content { padding: 40px 30px; }
  .content h2 { color: #1a1a1a; margin: 0 0 20px; font-size: 22px; }
  .content p { color: #4a4a4a; margin: 0 0 15px; }
  .button { display: inline-block; background: linear-gradient(135deg, #d97706 0%, #ea580c 100%); color: #ffffff !important; text-decoration: none; padding: 14px 30px; border-radius: 8px; font-weight: 600; margin: 20px 0; }
  .footer { background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb; }
  .footer p { color: #6b7280; font-size: 12px; margin: 5px 0; }
  .footer a { color: #d97706; text-decoration: none; }
  .highlight { background-color: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #d97706; margin: 20px 0; }
  .listing-card { border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; margin: 15px 0; }
  .listing-image { width: 100%; height: 180px; object-fit: cover; }
  .listing-content { padding: 15px; }
  .listing-price { color: #d97706; font-size: 20px; font-weight: 700; margin: 0; }
  .listing-title { font-size: 14px; color: #1a1a1a; margin: 5px 0; }
  .listing-location { font-size: 12px; color: #6b7280; }
`;

function wrapInLayout(content: string, preheader?: string): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${APP_NAME}</title>
  <style>${baseStyles}</style>
</head>
<body>
  ${
    preheader
      ? `<div style="display:none;max-height:0;overflow:hidden;">${preheader}</div>`
      : ""
  }
  <div class="container">
    <div class="header">
      <h1>🏠 ${APP_NAME}</h1>
      <p>Trouvez votre bien à rénover</p>
    </div>
    ${content}
    <div class="footer">
      <p>© ${new Date().getFullYear()} ${APP_NAME}. Tous droits réservés.</p>
      <p>
        <a href="${APP_URL}">Visiter le site</a> • 
        <a href="${APP_URL}/favorites">Mes favoris</a> • 
        <a href="${APP_URL}/settings">Préférences</a>
      </p>
      <p style="margin-top: 15px;">
        Vous recevez cet email car vous êtes inscrit sur ${APP_NAME}.<br>
        <a href="${APP_URL}/unsubscribe">Se désabonner</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

// ============================================
// WELCOME EMAIL
// ============================================

export async function sendWelcomeEmail(to: string, name: string) {
  const content = `
    <div class="content">
      <h2>Bienvenue sur ${APP_NAME}, ${name} ! 🎉</h2>
      <p>
        Nous sommes ravis de vous compter parmi nous ! ${APP_NAME} vous aide à trouver 
        des biens immobiliers à rénover avec un fort potentiel.
      </p>
      
      <div class="highlight">
        <strong>🔍 Que pouvez-vous faire maintenant ?</strong>
        <ul style="margin: 10px 0 0; padding-left: 20px;">
          <li>Rechercher des biens à rénover dans toute la France</li>
          <li>Sauvegarder vos annonces favorites</li>
          <li>Recevoir des alertes personnalisées (bientôt)</li>
        </ul>
      </div>
      
      <p style="text-align: center;">
        <a href="${APP_URL}/search" class="button">Commencer ma recherche</a>
      </p>
      
      <p>
        Si vous avez des questions, n'hésitez pas à nous contacter.<br>
        À bientôt sur ${APP_NAME} !
      </p>
      
      <p style="margin-top: 30px;">
        <strong>L'équipe ${APP_NAME}</strong>
      </p>
    </div>
  `;

  return sendEmail({
    to,
    subject: `Bienvenue sur ${APP_NAME} ! 🏠`,
    html: wrapInLayout(
      content,
      `Bienvenue ${name} ! Découvrez des biens à rénover.`
    ),
  });
}

// ============================================
// ALERT EMAIL (for future use)
// ============================================

export interface ListingAlert {
  id: string;
  title: string;
  price: number;
  city: string;
  surface?: number;
  imageUrl?: string;
  url: string;
}

export async function sendAlertEmail(
  to: string,
  name: string,
  alertName: string,
  listings: ListingAlert[]
) {
  const listingsHtml = listings
    .slice(0, 5)
    .map(
      (listing) => `
      <div class="listing-card">
        ${
          listing.imageUrl
            ? `<img src="${listing.imageUrl}" alt="${listing.title}" class="listing-image">`
            : ""
        }
        <div class="listing-content">
          <p class="listing-price">${new Intl.NumberFormat("fr-FR", {
            style: "currency",
            currency: "EUR",
            maximumFractionDigits: 0,
          }).format(listing.price)}</p>
          <p class="listing-title">${listing.title}</p>
          <p class="listing-location">📍 ${listing.city}${
        listing.surface ? ` • ${listing.surface} m²` : ""
      }</p>
          <a href="${
            listing.url
          }" style="color: #d97706; font-size: 13px;">Voir l'annonce →</a>
        </div>
      </div>
    `
    )
    .join("");

  const content = `
    <div class="content">
      <h2>🔔 Nouvelles annonces pour "${alertName}"</h2>
      <p>
        Bonjour ${name},<br>
        Nous avons trouvé <strong>${listings.length} nouvelle${
    listings.length > 1 ? "s" : ""
  } annonce${listings.length > 1 ? "s" : ""}</strong> 
        correspondant à votre alerte !
      </p>
      
      ${listingsHtml}
      
      ${
        listings.length > 5
          ? `<p style="text-align: center; color: #6b7280;">+ ${
              listings.length - 5
            } autres annonces</p>`
          : ""
      }
      
      <p style="text-align: center;">
        <a href="${APP_URL}/search" class="button">Voir toutes les annonces</a>
      </p>
    </div>
  `;

  return sendEmail({
    to,
    subject: `🔔 ${listings.length} nouvelle${
      listings.length > 1 ? "s" : ""
    } annonce${listings.length > 1 ? "s" : ""} - ${alertName}`,
    html: wrapInLayout(
      content,
      `${listings.length} nouveaux biens correspondent à votre alerte "${alertName}"`
    ),
  });
}

// ============================================
// NEWSLETTER EMAIL (for future use)
// ============================================

export async function sendNewsletterEmail(
  to: string,
  name: string,
  subject: string,
  content: string
) {
  const htmlContent = `
    <div class="content">
      <h2>${subject}</h2>
      <p>Bonjour ${name},</p>
      ${content}
      <p style="margin-top: 30px;">
        <strong>L'équipe ${APP_NAME}</strong>
      </p>
    </div>
  `;

  return sendEmail({
    to,
    subject: `📰 ${subject}`,
    html: wrapInLayout(htmlContent),
  });
}

// ============================================
// PASSWORD RESET EMAIL (for future use)
// ============================================

export async function sendPasswordResetEmail(
  to: string,
  name: string,
  resetToken: string
) {
  const resetUrl = `${APP_URL}/reset-password?token=${resetToken}`;

  const content = `
    <div class="content">
      <h2>Réinitialisation de votre mot de passe</h2>
      <p>Bonjour ${name},</p>
      <p>
        Vous avez demandé à réinitialiser votre mot de passe. 
        Cliquez sur le bouton ci-dessous pour en choisir un nouveau :
      </p>
      
      <p style="text-align: center;">
        <a href="${resetUrl}" class="button">Réinitialiser mon mot de passe</a>
      </p>
      
      <p style="font-size: 13px; color: #6b7280;">
        Ce lien expire dans 1 heure. Si vous n'avez pas demandé cette réinitialisation, 
        ignorez simplement cet email.
      </p>
    </div>
  `;

  return sendEmail({
    to,
    subject: "Réinitialisation de votre mot de passe",
    html: wrapInLayout(content, "Réinitialisez votre mot de passe RenovScout"),
  });
}

// ============================================
// AGENCY MEMBER INVITATION EMAIL
// ============================================

export async function sendAgencyMemberInvitationEmail(
  to: string,
  agencyName: string,
  temporaryPassword: string,
  role: string
) {
  const loginUrl = `${APP_URL}/login`;
  const roleLabel =
    role === "AGENCY_ADMIN"
      ? "Administrateur"
      : role === "AGENCY_MANAGER"
      ? "Manager"
      : "Utilisateur";

  const content = `
    <div class="content">
      <h2>Bienvenue dans ${agencyName} !</h2>
      <p>Bonjour,</p>
      <p>
        Vous avez été ajouté(e) à l'agence <strong>${agencyName}</strong> avec le rôle de <strong>${roleLabel}</strong>.
      </p>
      <p>
        Pour accéder à votre compte, utilisez les identifiants suivants :
      </p>
      <div class="highlight">
        <p><strong>Email :</strong> ${to}</p>
        <p><strong>Mot de passe temporaire :</strong> <code style="font-size: 16px; padding: 4px 8px; background: #f3f4f6; border-radius: 4px;">${temporaryPassword}</code></p>
      </div>
      <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 20px 0; border-radius: 4px;">
        <strong>⚠️ Important :</strong> Vous devrez changer ce mot de passe lors de votre première connexion.
      </div>
      <p style="text-align: center;">
        <a href="${loginUrl}" class="button">Se connecter</a>
      </p>
      <p>
        Si vous avez des questions, n'hésitez pas à contacter votre administrateur d'agence.
      </p>
      <p style="margin-top: 30px;">
        <strong>L'équipe ${APP_NAME}</strong>
      </p>
    </div>
  `;

  return sendEmail({
    to,
    subject: `Invitation à rejoindre ${agencyName}`,
    html: wrapInLayout(content, `Vous avez été invité(e) à rejoindre ${agencyName}`),
  });
}

// ============================================
// EMAIL VERIFICATION (for future use)
// ============================================

export async function sendVerificationEmail(
  to: string,
  name: string,
  verificationToken: string
) {
  const verifyUrl = `${APP_URL}/verify-email?token=${verificationToken}`;

  const content = `
    <div class="content">
      <h2>Vérifiez votre adresse email</h2>
      <p>Bonjour ${name},</p>
      <p>
        Pour finaliser votre inscription, veuillez confirmer votre adresse email 
        en cliquant sur le bouton ci-dessous :
      </p>
      
      <p style="text-align: center;">
        <a href="${verifyUrl}" class="button">Vérifier mon email</a>
      </p>
      
      <p style="font-size: 13px; color: #6b7280;">
        Ce lien expire dans 24 heures.
      </p>
    </div>
  `;

  return sendEmail({
    to,
    subject: "Vérifiez votre adresse email",
    html: wrapInLayout(
      content,
      "Confirmez votre email pour activer votre compte"
    ),
  });
}
