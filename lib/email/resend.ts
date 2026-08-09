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

// ── Admin: New Creator Application ────────────────────────────────────────

export async function sendAdminCreatorApplication(opts: {
  name: string;
  email: string;
  platform: string;
  handle: string;
  followerRange: string;
  niche: string;
  hasBrandDeals: boolean;
  bestPostUrl: string;
}) {
  const subject = `New creator application: ${opts.name}`;
  const body = `
    <p style="margin:0 0 16px;">A new creator has applied to join the ${SITE.name} network.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;border:1px solid ${BORDER};border-radius:0;overflow:hidden;">
      <tr>
        <td style="padding:16px;background-color:${BG};">
          <p style="margin:0 0 8px;font-size:14px;font-family:Arial,sans-serif;"><strong>Name:</strong> ${opts.name}</p>
          <p style="margin:0 0 8px;font-size:14px;font-family:Arial,sans-serif;"><strong>Email:</strong> <a href="mailto:${opts.email}" style="color:${INK};">${opts.email}</a></p>
          <p style="margin:0 0 8px;font-size:14px;font-family:Arial,sans-serif;"><strong>Platform:</strong> ${opts.platform} — ${opts.handle}</p>
          <p style="margin:0 0 8px;font-size:14px;font-family:Arial,sans-serif;"><strong>Followers:</strong> ${opts.followerRange}</p>
          <p style="margin:0 0 8px;font-size:14px;font-family:Arial,sans-serif;"><strong>Niche:</strong> ${opts.niche}</p>
          <p style="margin:0 0 8px;font-size:14px;font-family:Arial,sans-serif;"><strong>Brand deals before:</strong> ${opts.hasBrandDeals ? 'Yes' : 'No'}</p>
          <p style="margin:0;font-size:14px;font-family:Arial,sans-serif;"><strong>Best recent post:</strong> <a href="${opts.bestPostUrl}" style="color:${INK};">${opts.bestPostUrl}</a></p>
        </td>
      </tr>
    </table>
  `;

  return getResend().emails.send({
    from: FROM_EMAIL,
    to: ADMIN_EMAIL,
    subject,
    html: baseTemplate('New Creator Application', body),
  });
}

// ── Admin: New Brand Inquiry ──────────────────────────────────────────────

export async function sendAdminBrandInquiry(opts: {
  name: string;
  email: string;
  company: string;
  website: string;
  category: string;
  targetMarket: string;
  likedCreators: string;
  budgetRange: string;
  notes: string;
}) {
  const subject = `New brand inquiry: ${opts.company}`;
  const row = (label: string, value: string) =>
    value
      ? `<p style="margin:0 0 8px;font-size:14px;font-family:Arial,sans-serif;"><strong>${label}:</strong> ${value}</p>`
      : '';
  const body = `
    <p style="margin:0 0 16px;">A brand has asked about creator campaigns through ${SITE.name}.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;border:1px solid ${BORDER};border-radius:0;overflow:hidden;">
      <tr>
        <td style="padding:16px;background-color:${BG};">
          ${row('Name', opts.name)}
          ${row('Email', `<a href="mailto:${opts.email}" style="color:${INK};">${opts.email}</a>`)}
          ${row('Brand', opts.company)}
          ${row('Website', opts.website ? `<a href="${opts.website}" style="color:${INK};">${opts.website}</a>` : '')}
          ${row('Sells', opts.category)}
          ${row('Target market', opts.targetMarket)}
          ${row('Creators they like', opts.likedCreators)}
          ${row('Budget', opts.budgetRange)}
          ${row('Notes', opts.notes)}
        </td>
      </tr>
    </table>
  `;

  return getResend().emails.send({
    from: FROM_EMAIL,
    to: ADMIN_EMAIL,
    subject,
    html: baseTemplate('New Brand Inquiry', body),
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

// ── Top 100 claim request — a ranked business wants its profile ────────────

export async function sendAdminTop100ClaimRequest(opts: {
  listTitle: string;
  listPage: string;
  rank: number;
  entryName: string;
  entryWebsite: string | null;
  listingId: string;
  listingSlug: string;
  claimerEmail: string;
  claimerUserId: string;
  relationship: string;
  certificationId: string | null;
  domainMatch: boolean;
  sameNameListingSlug: string | null;
}) {
  const {
    listTitle, listPage, rank, entryName, entryWebsite, listingId, listingSlug,
    claimerEmail, claimerUserId, relationship, certificationId, domainMatch,
    sameNameListingSlug,
  } = opts;
  const subject = `Top 100 claim: ${entryName} (#${rank}, ${listTitle})`;
  const matchLine = domainMatch
    ? `<span style="color:#1a7f37;font-weight:700;">MATCH</span> — claimer email domain matches the entry's website`
    : `<span style="color:#b42318;font-weight:700;">NO MATCH</span> — verify ownership before approving`;
  const body = `
    <p style="margin:0 0 16px;">A ranked business has claimed its Top 100 profile. A pending listing was created from the ranking data — approving the listing in the admin approves the claim and sends the badge.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;border:1px solid ${BORDER};border-radius:0;overflow:hidden;">
      <tr><td style="padding:16px;background-color:${BG};">
        <p style="margin:0 0 8px;font-size:14px;font-family:Arial,sans-serif;"><strong>Entry:</strong> ${entryName} — #${rank}, <a href="${SITE.url}${listPage}" style="color:${INK};">${listTitle}</a></p>
        <p style="margin:0 0 8px;font-size:14px;font-family:Arial,sans-serif;"><strong>Entry website:</strong> ${entryWebsite ?? '—'}</p>
        <p style="margin:0 0 8px;font-size:14px;font-family:Arial,sans-serif;"><strong>Domain check:</strong> ${matchLine}</p>
        <p style="margin:0 0 8px;font-size:14px;font-family:Arial,sans-serif;"><strong>Claimer:</strong> <a href="mailto:${claimerEmail}" style="color:${INK};">${claimerEmail}</a> (user ${claimerUserId})</p>
        <p style="margin:0 0 8px;font-size:14px;font-family:Arial,sans-serif;"><strong>Certification ID:</strong> ${certificationId ?? '—'}</p>
        <p style="margin:0 0 8px;font-size:14px;font-family:Arial,sans-serif;"><strong>Pending listing:</strong> ${listingSlug} (${listingId})</p>
        ${sameNameListingSlug ? `<p style="margin:0 0 8px;font-size:14px;font-family:Arial,sans-serif;color:#b42318;"><strong>Heads up:</strong> a listing with the same name already exists (${sameNameListingSlug}) — check for a duplicate before approving.</p>` : ''}
        <p style="margin:0;font-size:14px;font-family:Arial,sans-serif;"><strong>Relationship:</strong><br/>${relationship.replace(/\n/g, '<br/>')}</p>
      </td></tr>
    </table>
    <p style="margin:0;text-align:center;">
      ${buttonHtml(`${SITE.url}/admin`, 'Review in Admin')}
    </p>
  `;

  return getResend().emails.send({
    from: FROM_EMAIL,
    to: ADMIN_EMAIL,
    subject,
    html: baseTemplate('Top 100 Claim Request', body),
    replyTo: claimerEmail,
  });
}

// ── Top 100 badge — sent to the owner when their claim is approved ─────────

export async function sendTop100BadgeEmail(opts: {
  to: string;
  entryName: string;
  listTitle: string;
  listPage: string;
  rank: number;
  badgeUrl: string;
  embedCode: string;
  profileUrl: string;
}) {
  const { to, entryName, listTitle, listPage, rank, badgeUrl, embedCode, profileUrl } = opts;
  const subject = `Your Top 100 profile is live — ranked #${rank}`;
  const body = `
    <p style="margin:0 0 16px;">Your claim for <strong>${entryName}</strong> is approved. Your profile is live on ${SITE.name}, and your ranking badge is ready.</p>
    <p style="margin:0 0 24px;font-size:14px;"><strong>${listTitle}</strong> — Ranked #${rank}</p>
    <p style="margin:0 0 24px;text-align:center;">
      <a href="${SITE.url}${listPage}"><img src="${badgeUrl}" alt="${SITE.name} ${listTitle} — Ranked #${rank}" width="360" height="88" style="border:0;max-width:100%;" /></a>
    </p>
    <p style="margin:0 0 8px;font-size:14px;"><strong>Put it on your website</strong> — paste this where you want the badge. It links back to the ranking and your rank updates automatically with the monthly review:</p>
    <pre style="margin:0 0 24px;padding:14px;background-color:#f4f4f4;border:1px solid ${BORDER};font-size:11px;overflow-x:auto;white-space:pre-wrap;word-break:break-all;font-family:Courier,monospace;">${embedCode.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
    <p style="margin:0 0 16px;font-size:14px;">Next: add photos and finish your profile — listings with photos appear on the ranking itself.</p>
    <p style="margin:0 0 24px;text-align:center;">
      ${buttonHtml(`${SITE.url}/dashboard`, 'Finish Your Profile')}
    </p>
    <p style="margin:0;font-size:13px;color:#888;">Your live profile: <a href="${profileUrl}" style="color:${INK};">${profileUrl}</a></p>
  `;

  return getResend().emails.send({
    from: FROM_EMAIL,
    to,
    subject,
    html: baseTemplate('Ranked. Claimed. Live.', body),
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

// ── FitBodega 100 Audit Report ─────────────────────────────────────────────

export async function sendAuditEmail(
  to: string,
  report: {
    headline: string;
    assessment: string;
    recommendations: Array<{
      title: string;
      detail: string;
      exemplarName: string;
      exemplarRank: number;
      listSlug: string;
      listLabel: string;
      study: string;
    }>;
    nextStep: string;
  }
) {
  const recs = report.recommendations
    .map(
      (r, i) => `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;border:1px solid ${BORDER};">
      <tr><td style="padding:18px;background-color:${BG};">
        <p style="margin:0 0 6px;font-size:12px;font-family:Arial,sans-serif;letter-spacing:1px;text-transform:uppercase;color:#666;">0${i + 1}</p>
        <p style="margin:0 0 8px;font-size:16px;font-family:Arial,sans-serif;font-weight:700;">${r.title}</p>
        <p style="margin:0 0 10px;font-size:14px;font-family:Arial,sans-serif;line-height:1.6;">${r.detail}</p>
        <p style="margin:0;font-size:13px;font-family:Arial,sans-serif;line-height:1.6;color:#444;">
          <strong>Study:</strong> <a href="${SITE.url}${r.listSlug}" style="color:${INK};">${r.exemplarName}</a>
          (#${r.exemplarRank}, ${r.listLabel}) &mdash; ${r.study}
        </p>
      </td></tr>
    </table>`
    )
    .join('');

  const body = `
    <p style="margin:0 0 16px;font-size:15px;font-family:Arial,sans-serif;line-height:1.6;">${report.assessment}</p>
    ${recs}
    <p style="margin:0 0 24px;font-size:14px;font-family:Arial,sans-serif;line-height:1.6;">${report.nextStep}</p>
    ${buttonHtml(`${SITE.url}/submit`, 'List Your Space')}
    <p style="margin:24px 0 0;font-size:12px;font-family:Arial,sans-serif;color:#888;line-height:1.6;">Benchmarks reference the FitBodega 100 &mdash; world rankings of training culture, reviewed monthly. <a href="${SITE.url}/top-100" style="color:#888;">See the rankings</a>.</p>
  `;

  return getResend().emails.send({
    from: FROM_EMAIL,
    to,
    subject: `${report.headline} — your FitBodega 100 audit`,
    html: baseTemplate(report.headline, body),
  });
}
