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

            <LegalSection title="2. What We Are — and What We Are Not">
              <p>
                {SITE.name} is a curated directory for recovery studios, gyms, coaches, nutritionists, health food stores, clubs, and youth sports programs — starting in Vancouver and open worldwide. We allow fitness and recovery businesses to create listings and allow the public to discover them.
              </p>
              <p>
                <strong className="text-on-surface">We are a directory only.</strong> We are not a party to any interaction, booking, membership, purchase, training program, treatment, or other engagement between you and any listed business. Any transaction you enter into with a listed business is solely between you and that business, on that business&apos;s own terms. We do not operate, own, inspect, supervise, or control any listed business or the services it provides.
              </p>
              <p>
                We reserve the right to modify, suspend, or discontinue any part of our services at any time without notice.
              </p>
            </LegalSection>

            <LegalSection title="3. Listing Your Space — Your Responsibility">
              <p>
                If you submit a listing (&ldquo;your space&rdquo;), the listing — and everything that flows from it — is your responsibility, not ours. By submitting a listing, you represent and warrant that:
              </p>
              <ul className="list-disc list-inside space-y-2 mt-2 pl-2">
                <li>All information you provide is accurate, current, and complete, and you will keep it up to date</li>
                <li>You own the business or are authorized to represent it</li>
                <li>You hold all licenses, permits, certifications, insurance, and regulatory approvals required to operate and to offer the services you advertise</li>
                <li>You own or have the right to use every image, logo, and piece of content you upload, and that content does not infringe any third party&apos;s rights</li>
                <li>Your listing and your business comply with all applicable laws and regulations, including health, safety, consumer-protection, and advertising rules</li>
              </ul>
              <p className="mt-4">
                You — not {SITE.name} — are solely responsible for the services your business provides, the safety of your premises and equipment, the qualifications of your staff, the outcomes of your clients, the handling of their personal information and payments, and any claim, complaint, injury, loss, or dispute arising out of or relating to your listing or your business. Publishing your listing in our directory does not shift any of that responsibility to us.
              </p>
              <p>
                We reserve the right to reject, remove, edit, or suspend any listing at any time, at our sole discretion and without notice or compensation — including for inaccurate information, complaints, legal risk, or violations of these terms. Free and paid listings alike are published at our discretion; a paid plan buys placement features, not a right to remain listed.
              </p>
            </LegalSection>

            <LegalSection title="4. No Endorsement, No Verification Guarantee">
              <p>
                Inclusion in the directory — including &ldquo;Featured&rdquo; placement or a &ldquo;Verified&rdquo; badge — is not an endorsement, recommendation, certification, or guarantee of any business, its qualifications, or the quality or safety of its services. &ldquo;Verified&rdquo; means only that we performed limited checks on listing information at a point in time; it is not an audit and does not mean we have inspected the business.
              </p>
              <p>
                Always do your own due diligence before engaging a listed business: verify credentials, licensing, and insurance directly with the business, and consult a physician before beginning any training, recovery, or nutrition program. Fitness, recovery, and athletic activities — including saunas, cold plunges, and physical training — carry inherent risks. You engage in them at your own risk.
              </p>
            </LegalSection>

            <LegalSection title="5. User Accounts">
              <p>
                You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
              </p>
              <p>
                We reserve the right to terminate accounts that violate these terms or that we determine, in our sole discretion, are harmful to the network.
              </p>
            </LegalSection>

            <LegalSection title="6. Prohibited Conduct">
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

            <LegalSection title="7. Reviews">
              <p>
                Reviews reflect the opinions of the people who write them, not ours. Reviewers are solely responsible for the content of their reviews. We may moderate, edit, or remove reviews at our discretion, but we do not verify their accuracy and are not liable for them. If you operate a listed business, you accept that users may review it, favourably or not.
              </p>
            </LegalSection>

            <LegalSection title="8. Intellectual Property">
              <p>
                The {SITE.name} name, logo, and all content on this website (except user-submitted content) are the property of {SITE.name} and are protected by copyright, trademark, and other intellectual property laws.
              </p>
              <p>
                By submitting content (listings, reviews, images), you grant us a non-exclusive, worldwide, royalty-free license to use, display, reproduce, and distribute that content in connection with our services, including in our marketing and social media. You remain responsible for the content you submit and warrant that you have the rights needed to grant this license.
              </p>
            </LegalSection>

            <LegalSection title="9. Payments and Subscriptions">
              <p>
                Certain features of our directory (such as verified or pro listings) require payment. All payments are processed securely by Stripe. By making a payment, you agree to Stripe&apos;s Terms of Service.
              </p>
              <p>
                Subscription fees are billed in advance on a recurring basis. You may cancel your subscription at any time; cancellation takes effect at the end of the current billing period. We do not provide refunds for partial billing periods, nor when a listing is removed for violating these terms.
              </p>
            </LegalSection>

            <LegalSection title="10. Disclaimer of Warranties">
              <p>
                Our services are provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranties of any kind, either express or implied. We do not warrant that the services will be uninterrupted, error-free, or completely secure.
              </p>
              <p>
                We are not responsible for the accuracy, completeness, or quality of any listing information, which is provided by the businesses themselves. We are not responsible for the acts or omissions of any listed business, or for any injury, loss, or damage arising from your dealings with one.
              </p>
            </LegalSection>

            <LegalSection title="11. Limitation of Liability">
              <p>
                To the maximum extent permitted by applicable law, {SITE.name} shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of our services or your dealings with any listed business, even if we have been advised of the possibility of such damages. Our total aggregate liability for any claim relating to the services shall not exceed the amount you paid us in the twelve months preceding the claim.
              </p>
            </LegalSection>

            <LegalSection title="12. Indemnification">
              <p>
                If you list a business with us, you agree to indemnify, defend, and hold harmless {SITE.name} and its owner from and against any claims, damages, losses, liabilities, and expenses (including reasonable legal fees) arising out of or relating to your listing, your content, your business, the services you provide, or your breach of these terms.
              </p>
            </LegalSection>

            <LegalSection title="13. Governing Law">
              <p>
                These terms shall be governed by and construed in accordance with the laws of the Province of British Columbia and the federal laws of Canada applicable therein. Any disputes shall be resolved through good-faith negotiation; if that fails, in the courts of British Columbia.
              </p>
            </LegalSection>

            <LegalSection title="14. Contact Us">
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
