import type { Metadata } from "next";
import { SITE } from "@/lib/config/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `Privacy Policy for ${SITE.name}. Learn how we collect, use, and protect your personal information.`,
  alternates: { canonical: `${SITE.url}/privacy` },
};

const LAST_UPDATED = "July 2026";

export default function PrivacyPage() {
  return (
    <div className="bg-bg min-h-screen">
      {/* Header */}
      <section className="pt-32 pb-12 bg-bg">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-7 h-[3px] bg-primary" aria-hidden />
            <p className="font-sans text-label-md uppercase text-primary">Legal</p>
          </div>
          <h1 className="font-serif text-display-sm uppercase text-on-surface mb-3">
            Privacy Policy
          </h1>
          <p className="font-sans text-sm text-on-surface-variant">
            Last updated: {LAST_UPDATED}
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="pb-24">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <div className="bg-surface-card p-8 lg:p-12 space-y-10 font-sans text-sm text-on-surface-variant leading-relaxed">

            <LegalSection title="1. Introduction">
              <p>
                {SITE.name} (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) operates {SITE.url}. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services.
              </p>
              <p>
                By using our services, you agree to the collection and use of information in accordance with this policy. If you have questions, contact us at{" "}
                <a href={`mailto:${SITE.email}`} className="text-primary hover:underline">
                  {SITE.email}
                </a>.
              </p>
            </LegalSection>

            <LegalSection title="2. Information We Collect">
              <p>We collect information you provide directly to us, including:</p>
              <ul className="list-disc list-inside space-y-2 mt-2 pl-2">
                <li>Name, email address, and password when you create an account</li>
                <li>Business information when you submit a listing (name, location, website, description)</li>
                <li>Email address when you subscribe to our newsletter</li>
                <li>Messages you send through our contact forms</li>
                <li>Payment information processed securely by Stripe (we do not store card details)</li>
              </ul>
              <p className="mt-4">We also collect information automatically, including:</p>
              <ul className="list-disc list-inside space-y-2 mt-2 pl-2">
                <li>Log data (IP address, browser type, pages visited, time spent)</li>
                <li>Cookies and similar tracking technologies</li>
                <li>Device information</li>
              </ul>
            </LegalSection>

            <LegalSection title="3. How We Use Your Information">
              <p>We use the information we collect to:</p>
              <ul className="list-disc list-inside space-y-2 mt-2 pl-2">
                <li>Provide, maintain, and improve our services</li>
                <li>Process listing submissions and manage your account</li>
                <li>Send transactional emails (submission confirmations, account notifications)</li>
                <li>Send our newsletter, if you have subscribed (you can unsubscribe at any time)</li>
                <li>Respond to your comments, questions, and customer service requests</li>
                <li>Monitor and analyze usage patterns to improve the directory</li>
                <li>Comply with legal obligations</li>
              </ul>
            </LegalSection>

            <LegalSection title="4. Sharing of Information">
              <p>
                We do not sell your personal information. We may share your information with:
              </p>
              <ul className="list-disc list-inside space-y-2 mt-2 pl-2">
                <li>Service providers who assist in operating our website (Supabase, Vercel, Stripe, Resend)</li>
                <li>Analytics providers to help us understand how our services are used</li>
                <li>Law enforcement or legal processes when required by law</li>
              </ul>
              <p className="mt-4">
                <strong className="text-on-surface">Listings are public by design.</strong> All listing information you submit — business name, address, phone number, email, website, social media links, images, descriptions, and specialties — is published openly on our directory. It can be viewed by anyone, indexed by search engines and AI systems, and may appear in our social media posts, share images, and marketing materials.
              </p>
              <p>
                You choose what goes into your listing, and you are responsible for that choice. Do not include information you are not comfortable making public — for example, a personal cell number or home address. If you include personal information about other people (such as staff names or photos), you are responsible for having their consent.
              </p>
              <p>
                You can request corrections to your listing, or its removal from the directory, at any time by contacting{" "}
                <a href={`mailto:${SITE.email}`} className="text-primary hover:underline">
                  {SITE.email}
                </a>. Note that removed listings may persist for a time in search engine caches and other third-party copies we do not control.
              </p>
            </LegalSection>

            <LegalSection title="5. Data Retention">
              <p>
                We retain your personal information for as long as necessary to provide our services and comply with legal obligations. You may request deletion of your account and associated data by contacting us at{" "}
                <a href={`mailto:${SITE.email}`} className="text-primary hover:underline">
                  {SITE.email}
                </a>.
              </p>
            </LegalSection>

            <LegalSection title="6. Cookies">
              <p>
                We use cookies and similar tracking technologies to track activity on our website and store certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
              </p>
              <p>
                We use essential cookies (required for the site to function), preference cookies (to remember your settings), and analytics cookies (to understand how visitors use the site).
              </p>
            </LegalSection>

            <LegalSection title="7. Your Rights">
              <p>Depending on your location, you may have the right to:</p>
              <ul className="list-disc list-inside space-y-2 mt-2 pl-2">
                <li>Access the personal information we hold about you</li>
                <li>Correct inaccurate personal information</li>
                <li>Request deletion of your personal information</li>
                <li>Object to our processing of your personal information</li>
                <li>Withdraw consent at any time (where processing is based on consent)</li>
              </ul>
              <p className="mt-4">
                To exercise these rights, contact us at{" "}
                <a href={`mailto:${SITE.email}`} className="text-primary hover:underline">
                  {SITE.email}
                </a>.
              </p>
            </LegalSection>

            <LegalSection title="8. Security">
              <p>
                We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet is 100% secure.
              </p>
            </LegalSection>

            <LegalSection title="9. Children's Privacy">
              <p>
                Our services are not directed to children under 13. We do not knowingly collect personal information from children under 13. If you believe a child has provided us with personal information, please contact us immediately.
              </p>
            </LegalSection>

            <LegalSection title="10. Changes to This Policy">
              <p>
                We may update this Privacy Policy from time to time. We will notify you of significant changes by posting the new policy on this page and updating the &ldquo;Last Updated&rdquo; date. Your continued use of our services after any changes constitutes your acceptance of the new policy.
              </p>
            </LegalSection>

            <LegalSection title="11. Contact Us">
              <p>
                If you have questions or concerns about this Privacy Policy, please contact us:
              </p>
              <div className="mt-3 space-y-1">
                <p className="font-semibold text-on-surface">{SITE.name}</p>
                <p>
                  <a href={`mailto:${SITE.email}`} className="text-primary hover:underline">
                    {SITE.email}
                  </a>
                </p>
                <p>
                  <a href={SITE.url} className="text-primary hover:underline">
                    {SITE.url}
                  </a>
                </p>
              </div>
            </LegalSection>

          </div>
        </div>
      </section>
    </div>
  );
}

function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-serif text-lg font-extrabold uppercase tracking-tight text-on-surface mb-4">
        {title}
      </h2>
      <div className="space-y-3">
        {children}
      </div>
    </div>
  );
}
