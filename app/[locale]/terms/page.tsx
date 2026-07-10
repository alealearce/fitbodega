import type { Metadata } from "next";
import { SITE } from "@/lib/config/site";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: `Terms of Use for ${SITE.name}. Please read these terms carefully before using our services.`,
  alternates: { canonical: `${SITE.url}/terms` },
};

const LAST_UPDATED = "July 2026";

export default function TermsPage() {
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
            Terms of Use
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

            <LegalSection title="1. Acceptance of Terms">
              <p>
                By accessing or using {SITE.name} (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) at {SITE.url}, you agree to be bound by these Terms of Use. If you do not agree to these terms, please do not use our services.
              </p>
              <p>
                We reserve the right to modify these terms at any time. Continued use of the service after changes constitutes your acceptance of the new terms.
              </p>
            </LegalSection>

            <LegalSection title="2. Description of Services">
              <p>
                {SITE.name} provides a curated directory for recovery studios, gyms, coaches, nutritionists, health food stores, and youth sports programs — starting in Vancouver and open worldwide. We allow fitness and recovery businesses to create listings and allow the public to discover them.
              </p>
              <p>
                We reserve the right to modify, suspend, or discontinue any part of our services at any time without notice.
              </p>
            </LegalSection>

            <LegalSection title="3. Listing Submissions">
              <p>When you submit a listing to our directory, you agree that:</p>
              <ul className="list-disc list-inside space-y-2 mt-2 pl-2">
                <li>All information you provide is accurate, current, and complete</li>
                <li>You have the right to submit the business or practice for listing</li>
                <li>Your listing does not violate any applicable laws or regulations</li>
                <li>Your listing does not infringe on any third-party intellectual property rights</li>
                <li>You will keep your listing information up to date</li>
              </ul>
              <p className="mt-4">
                We reserve the right to reject, remove, or modify any listing at our sole discretion. Grounds for removal include (but are not limited to) inaccurate information, inappropriate content, or violations of these terms.
              </p>
            </LegalSection>

            <LegalSection title="4. User Accounts">
              <p>
                You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
              </p>
              <p>
                We reserve the right to terminate accounts that violate these terms or that we determine, in our sole discretion, are harmful to the network.
              </p>
            </LegalSection>

            <LegalSection title="5. Prohibited Conduct">
              <p>You agree not to:</p>
              <ul className="list-disc list-inside space-y-2 mt-2 pl-2">
                <li>Submit false, misleading, or fraudulent listings or information</li>
                <li>Use our services for any unlawful purpose</li>
                <li>Harass, abuse, or harm other users or listed businesses</li>
                <li>Attempt to gain unauthorized access to any part of our services</li>
                <li>Use automated tools to scrape or collect data without permission</li>
                <li>Post spam or unsolicited commercial content</li>
                <li>Submit reviews that are fake, incentivized, or otherwise misleading</li>
              </ul>
            </LegalSection>

            <LegalSection title="6. Intellectual Property">
              <p>
                The {SITE.name} name, logo, and all content on this website (except user-submitted content) are the property of {SITE.name} and are protected by copyright, trademark, and other intellectual property laws.
              </p>
              <p>
                By submitting content (listings, reviews, images), you grant us a non-exclusive, worldwide, royalty-free license to use, display, and distribute that content in connection with our services.
              </p>
            </LegalSection>

            <LegalSection title="7. Payments and Subscriptions">
              <p>
                Certain features of our directory (such as verified or pro listings) require payment. All payments are processed securely by Stripe. By making a payment, you agree to Stripe&apos;s Terms of Service.
              </p>
              <p>
                Subscription fees are billed in advance on a recurring basis. You may cancel your subscription at any time; cancellation takes effect at the end of the current billing period. We do not provide refunds for partial billing periods.
              </p>
            </LegalSection>

            <LegalSection title="8. Disclaimer of Warranties">
              <p>
                Our services are provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranties of any kind, either express or implied. We do not warrant that the services will be uninterrupted, error-free, or completely secure.
              </p>
              <p>
                We are not responsible for the accuracy, completeness, or quality of any listing information. Users should conduct their own due diligence before engaging with listed businesses, including verifying credentials before beginning any training, recovery, or nutrition program.
              </p>
            </LegalSection>

            <LegalSection title="9. Limitation of Liability">
              <p>
                To the maximum extent permitted by applicable law, {SITE.name} shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of our services, even if we have been advised of the possibility of such damages.
              </p>
            </LegalSection>

            <LegalSection title="10. Governing Law">
              <p>
                These terms shall be governed by and construed in accordance with applicable law. Any disputes shall be resolved through good-faith negotiation; if that fails, through binding arbitration.
              </p>
            </LegalSection>

            <LegalSection title="11. Contact Us">
              <p>
                If you have questions about these Terms of Use, please contact us:
              </p>
              <div className="mt-3 space-y-1">
                <p className="font-semibold text-on-surface">{SITE.name}</p>
                <p>
                  <a href={`mailto:${SITE.email}`} className="text-primary hover:underline">
                    {SITE.email}
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
