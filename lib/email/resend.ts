import { Resend } from 'resend';
import { SITE } from '@/lib/config/site';

function getResend() {
  return new Resend(process.env.RESEND_API_KEY ?? 'placeholder');
}

const FROM_EMAIL = SITE.fromEmail;
const ADMIN_EMAIL = SITE.supportEmail;

// ── Brand styles (inline, for email client compatibility) ──────────────────
// Emails stay light/email-safe for deliverability; the header carries the
// dark FitBodega wordmark treatment. Square corners throughout — no
// border-radius on any surface.
const INK = '#0e0e0e';
const LIME = '#d1fc00';
const LIME_TEXT = '#161900';
const BG = '#ffffff';
const BORDER = '#e8e8e8';

function baseTemplate(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:${BG};font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:${BG};padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border:1px solid ${BORDER};border-radius:0;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="background-color:${INK};padding:32px 40px;text-align:left;">
              <p style="margin:0;font-size:24px;font-weight:800;letter-spacing:-0.5px;text-transform:uppercase;font-family:Arial,sans-serif;">
                <span style="color:#ffffff;">FIT</span><span style="color:${LIME};">BODEGA</span>
              </p>
              <h1 style="margin:16px 0 0;color:#ffffff;font-size:20px;font-weight:normal;font-family:Arial,sans-serif;">${title}</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;color:#2d2d2d;font-size:16px;line-height:1.7;">
              ${bodyHtml}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;border-top:1px solid ${BORDER};text-align:center;">
              <p style="margin:0;font-size:12px;color:#888;font-family:Arial,sans-serif;">
                ${SITE.name} &mdash; ${SITE.tagline}<br/>
                <a href="${SITE.url}" style="color:${INK};text-decoration:none;">${SITE.domain}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buttonHtml(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background-color:${LIME};color:${LIME_TEXT};padding:14px 32px;border-radius:0;text-decoration:none;font-family:Arial,sans-serif;font-size:14px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;">${label}</a>`;
}

// ── Welcome Email ──────────────────────────────────────────────────────────

export async function sendWelcomeEmail(to: string, name: string) {
  const subject = `Welcome to ${SITE.name} — your listing is under review`;
  const body = `
    <p style="margin:0 0 16px;">Dear ${name},</p>
    <p style="margin:0 0 16px;">Thank you for submitting your listing to <strong>${SITE.name}</strong>. Welcome to the network of curated recovery studios, gyms, coaches, nutritionists, health food stores, and youth sports programs.</p>
    <p style="margin:0 0 16px;">Your listing is currently under review. We aim to review all submissions within 1&ndash;2 business days. You will receive an email as soon as your listing is approved and live on the directory.</p>
    <p style="margin:0 0 16px;">If you have any questions or would like to make changes to your submission, reply to this email or reach out at <a href="mailto:${ADMIN_EMAIL}" style="color:${INK};">${ADMIN_EMAIL}</a>.</p>
    <p style="margin:0;">The ${SITE.name} Team</p>
  `;

  return getResend().emails.send({
    from: FROM_EMAIL,
    to,
    subject,
    html: baseTemplate('Your Listing is Being Reviewed', body),
  });
}

// ── "You're Featured" Email ────────────────────────────────────────────────

export async function sendFeaturedEmail(to: string, name: string, listingUrl: string) {
  const subject = `${name}, you're featured on ${SITE.name} today`;
  const body = `
    <p style="margin:0 0 16px;">Dear ${name},</p>
    <p style="margin:0 0 16px;">Good news — <strong>${name}</strong> is today's featured spotlight on the ${SITE.name} social channels.</p>
    <p style="margin:0 0 16px;">Share the post to your own story or feed — it helps more people in the network discover you. Head to <a href="${SITE.social.instagram}" style="color:${INK};">Instagram</a> to find today's post and reshare.</p>
    <p style="margin:0 0 16px;">Your listing: <a href="${listingUrl}" style="color:${INK};">${listingUrl}</a></p>
    <p style="margin:0 0 16px;">Thank you for being part of the network.</p>
    <p style="margin:0;">The ${SITE.name} Team</p>
  `;

  return getResend().emails.send({
    from: FROM_EMAIL,
    to,
    subject,
    html: baseTemplate("You're Featured Today", body),
  });
}

// ── Approval Email ─────────────────────────────────────────────────────────

export async function sendApprovalEmail(
  to: string,
  name: string,
  listingName: string,
  listingUrl: string,
  spotlightUrl?: string
) {
  const subject = spotlightUrl
    ? `You're live on ${SITE.name} — and so is your Spotlight`
    : `Your listing "${listingName}" is now live on ${SITE.name}`;
  const spotlightBlock = spotlightUrl
    ? `
    <p style="margin:0 0 16px;">And there's more — as a new member of the network, we've published your <strong>Member Spotlight</strong> in The Journal and featured you across our channels.</p>
    <p style="margin:0 0 24px;text-align:center;">
      ${buttonHtml(spotlightUrl, 'Read Your Spotlight')}
    </p>
    <p style="margin:0 0 24px;">Share it with your audience — it links straight back to your listing and tells people exactly why to train with you.</p>`
    : '';
  const body = `
    <p style="margin:0 0 16px;">Dear ${name},</p>
    <p style="margin:0 0 16px;">Good news — <strong>${listingName}</strong> has been approved and is now live on ${SITE.name}.</p>
    <p style="margin:0 0 24px;">People training and recovering seriously can now discover your space and find their way to you.</p>
    <p style="margin:0 0 24px;text-align:center;">
      ${buttonHtml(listingUrl, 'View Your Listing')}
    </p>
    ${spotlightBlock}
    <p style="margin:0 0 16px;">To maximize your visibility, consider upgrading to a <strong>Verified</strong> or <strong>Pro</strong> plan for a featured placement and enhanced profile options.</p>
    <p style="margin:0;">The ${SITE.name} Team</p>
  `;

  return getResend().emails.send({
    from: FROM_EMAIL,
    to,
    subject,
    html: baseTemplate(spotlightUrl ? `${listingName} is Live — Spotlight Included` : `${listingName} is Live`, body),
  });
}

// ── Spotlight Live Email (manual/retry path — listing already approved) ─────

export async function sendSpotlightLiveEmail(to: string, name: string, spotlightUrl: string) {
  const subject = `Your Member Spotlight is live on ${SITE.name}`;
  const body = `
    <p style="margin:0 0 16px;">Dear ${name},</p>
    <p style="margin:0 0 16px;">Your <strong>Member Spotlight</strong> has been published in The Journal and featured across the ${SITE.name} channels.</p>
    <p style="margin:0 0 24px;text-align:center;">
      ${buttonHtml(spotlightUrl, 'Read Your Spotlight')}
    </p>
    <p style="margin:0 0 16px;">Share it with your audience — it links straight back to your listing.</p>
    <p style="margin:0;">The ${SITE.name} Team</p>
  `;

  return getResend().emails.send({
    from: FROM_EMAIL,
    to,
    subject,
    html: baseTemplate('Your Spotlight is Live', body),
  });
}

// ── Rejection Email ────────────────────────────────────────────────────────

export async function sendRejectionEmail(
  to: string,
  name: string,
  listingName: string,
  reason: string
) {
  const subject = `Update on your listing "${listingName}" — action needed`;
  const body = `
    <p style="margin:0 0 16px;">Dear ${name},</p>
    <p style="margin:0 0 16px;">Thank you for your interest in listing <strong>${listingName}</strong> on ${SITE.name}. After review, we were unable to approve your submission at this time.</p>
    <p style="margin:0 0 8px;"><strong>Reason:</strong></p>
    <p style="margin:0 0 16px;padding:16px;background-color:${BG};border-left:3px solid ${INK};border-radius:0;">${reason}</p>
    <p style="margin:0 0 16px;">You are welcome to make the necessary updates and resubmit your listing. Reply to this email with any questions.</p>
    <p style="margin:0;">The ${SITE.name} Team</p>
  `;

  return getResend().emails.send({
    from: FROM_EMAIL,
    to,
    subject,
    html: baseTemplate('Listing Review Update', body),
  });
}

// ── Lead Notification Email ────────────────────────────────────────────────

export async function sendLeadEmail(
  to: string,
  senderName: string,
  senderEmail: string,
  message: string,
  listingName: string
) {
  const subject = `New inquiry for ${listingName} via ${SITE.name}`;
  const body = `
    <p style="margin:0 0 16px;">You have received a new inquiry through your <strong>${listingName}</strong> listing on ${SITE.name}.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;border:1px solid ${BORDER};border-radius:0;overflow:hidden;">
      <tr>
        <td style="padding:16px;background-color:${BG};">
          <p style="margin:0 0 8px;font-size:14px;font-family:Arial,sans-serif;"><strong>From:</strong> ${senderName}</p>
          <p style="margin:0 0 8px;font-size:14px;font-family:Arial,sans-serif;"><strong>Email:</strong> <a href="mailto:${senderEmail}" style="color:${INK};">${senderEmail}</a></p>
          <p style="margin:0 0 8px;font-size:14px;font-family:Arial,sans-serif;"><strong>Message:</strong></p>
          <p style="margin:0;font-size:15px;line-height:1.6;">${message}</p>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 24px;">Reply directly to <a href="mailto:${senderEmail}" style="color:${INK};">${senderEmail}</a> to respond to this inquiry.</p>
    <p style="margin:0;font-size:13px;color:#888;font-family:Arial,sans-serif;">This inquiry was sent through your listing on ${SITE.name}.</p>
  `;

  return getResend().emails.send({
    from: FROM_EMAIL,
    to,
    subject,
    html: baseTemplate(`New Inquiry — ${listingName}`, body),
  });
}

// ── Newsletter Confirmation Email ──────────────────────────────────────────

export async function sendNewsletterConfirmation(to: string, confirmUrl: string) {
  const subject = `Confirm your subscription to ${SITE.name}`;
  const body = `
    <p style="margin:0 0 16px;">Thank you for your interest in ${SITE.name}.</p>
    <p style="margin:0 0 24px;">Confirm your subscription to start receiving updates on new spaces, coaches, and articles from the network.</p>
    <p style="margin:0 0 24px;text-align:center;">
      ${buttonHtml(confirmUrl, 'Confirm Subscription')}
    </p>
    <p style="margin:0 0 8px;font-size:13px;color:#888;font-family:Arial,sans-serif;">If you did not sign up for this newsletter, you can safely ignore this email — you will not be subscribed.</p>
    <p style="margin:0;font-size:13px;color:#888;font-family:Arial,sans-serif;">This link will expire in 48 hours.</p>
  `;

  return getResend().emails.send({
    from: FROM_EMAIL,
    to,
    subject,
    html: baseTemplate('Confirm Your Subscription', body),
  });
}

// ── Admin: New Listing Notification ───────────────────────────────────────

export async function sendAdminNewListing(
  listingName: string,
  listingType: string,
  submitterEmail: string
) {
  const subject = `New listing submitted: ${listingName}`;
  const body = `
    <p style="margin:0 0 16px;">A new listing has been submitted to ${SITE.name} and is awaiting review.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;border:1px solid ${BORDER};border-radius:0;overflow:hidden;">
      <tr>
        <td style="padding:16px;background-color:${BG};">
          <p style="margin:0 0 8px;font-size:14px;font-family:Arial,sans-serif;"><strong>Listing Name:</strong> ${listingName}</p>
          <p style="margin:0 0 8px;font-size:14px;font-family:Arial,sans-serif;"><strong>Type:</strong> ${listingType}</p>
          <p style="margin:0;font-size:14px;font-family:Arial,sans-serif;"><strong>Submitted By:</strong> <a href="mailto:${submitterEmail}" style="color:${INK};">${submitterEmail}</a></p>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 24px;text-align:center;">
      ${buttonHtml(`${SITE.url}/admin`, 'Review in Admin')}
    </p>
  `;

  return getResend().emails.send({
    from: FROM_EMAIL,
    to: ADMIN_EMAIL,
    subject,
    html: baseTemplate('New Listing Submission', body),
  });
}

// ── Admin: Listing Claim Request ──────────────────────────────────────────

export async function sendAdminClaimRequest(opts: {
  listingId: string;
  listingName: string;
  listingSlug: string;
  listingType: string;
  claimerEmail: string;
  claimerUserId: string;
  certificationId: string | null;
  relationship: string;
}) {
  const { listingId, listingName, listingSlug, listingType, claimerEmail, claimerUserId, certificationId, relationship } = opts;
  const subject = `Claim request: ${listingName}`;
  const body = `
    <p style="margin:0 0 16px;">A signed-in user has requested to claim a listing on ${SITE.name}.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;border:1px solid ${BORDER};border-radius:0;overflow:hidden;">
      <tr><td style="padding:16px;background-color:${BG};">
        <p style="margin:0 0 8px;font-size:14px;font-family:Arial,sans-serif;"><strong>Listing:</strong> ${listingName} (${listingType})</p>
        <p style="margin:0 0 8px;font-size:14px;font-family:Arial,sans-serif;"><strong>Listing ID:</strong> ${listingId}</p>
        <p style="margin:0 0 8px;font-size:14px;font-family:Arial,sans-serif;"><strong>Slug:</strong> ${listingSlug}</p>
        <p style="margin:0 0 8px;font-size:14px;font-family:Arial,sans-serif;"><strong>Claimer:</strong> <a href="mailto:${claimerEmail}" style="color:${INK};">${claimerEmail}</a></p>
        <p style="margin:0 0 8px;font-size:14px;font-family:Arial,sans-serif;"><strong>User ID:</strong> ${claimerUserId}</p>
        <p style="margin:0 0 8px;font-size:14px;font-family:Arial,sans-serif;"><strong>Certification ID:</strong> ${certificationId ?? '—'}</p>
        <p style="margin:0;font-size:14px;font-family:Arial,sans-serif;"><strong>Relationship:</strong><br/>${relationship.replace(/\n/g, '<br/>')}</p>
      </td></tr>
    </table>
    <p style="margin:0 0 24px;text-align:center;">
      ${buttonHtml(`${SITE.url}/admin`, 'Review in Admin')}
    </p>
    <p style="margin:0;font-size:12px;color:#888;font-family:Arial,sans-serif;">To approve: set listings.owner_id = '${claimerUserId}' (and listings.certification_id if provided) in Supabase.</p>
  `;

  return getResend().emails.send({
    from: FROM_EMAIL,
    to: ADMIN_EMAIL,
    subject,
    html: baseTemplate('Listing Claim Request', body),
    replyTo: claimerEmail,
  });
}

// ── Chatbot escalation — sent when Coach can't help or a password reset is requested ──

export async function sendEscalationEmail({
  sessionId,
  messages,
  userEmail,
}: {
  sessionId?: string;
  messages: { role: string; content: string }[];
  /** Account email the user shared in chat (e.g. password reset requests). */
  userEmail?: string;
}) {
  const transcript = messages
    .map(
      (m) =>
        `<p style="margin:8px 0;font-size:14px;font-family:Arial,sans-serif;"><strong>${m.role === 'user' ? 'User' : 'Coach'}:</strong> ${m.content}</p>`
    )
    .join('');

  const body = `
    <p style="margin:0 0 16px;">Coach ${userEmail ? 'received a password reset request' : 'was unable to fully help a user and directed them to contact support'}.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;border:1px solid ${BORDER};border-radius:0;overflow:hidden;">
      <tr><td style="padding:16px;background-color:${BG};">
        ${userEmail ? `<p style="margin:0 0 8px;font-size:15px;font-family:Arial,sans-serif;"><strong>User needs a password reset:</strong> <a href="mailto:${userEmail}" style="color:${INK};">${userEmail}</a></p>` : ''}
        <p style="margin:0 0 8px;font-size:14px;font-family:Arial,sans-serif;"><strong>Session ID:</strong> ${sessionId ?? 'n/a'}</p>
        <p style="margin:0;font-size:14px;font-family:Arial,sans-serif;"><strong>Time:</strong> ${new Date().toLocaleString('en-CA', { timeZone: 'America/Vancouver' })} PT</p>
      </td></tr>
    </table>
    <p style="margin:0 0 8px;font-size:14px;font-family:Arial,sans-serif;"><strong>Conversation transcript:</strong></p>
    ${transcript}
  `;

  return getResend().emails.send({
    from: FROM_EMAIL,
    to: [ADMIN_EMAIL, 'hi@arce.ca'],
    subject: userEmail
      ? `Password help requested by ${userEmail} — ${SITE.name}`
      : `Coach escalated a conversation — ${SITE.name}`,
    html: baseTemplate('Conversation Needs Follow-Up', body),
  });
}
