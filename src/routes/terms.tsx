import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, LegalSection, legalListClass } from "@/components/legal/LegalPage";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service | SaleSync" },
      { name: "description", content: "Terms governing access to and use of SaleSync." },
    ],
  }),
  component: TermsOfService,
});

function TermsOfService() {
  return (
    <LegalPage
      title="Terms of Service"
      description="These terms govern access to and use of SaleSync. By creating an account or using the service, you agree to them."
      effectiveDate="October 18, 2026"
    >
      <LegalSection title="1. Eligibility and acceptance">
        <p>
          You must be legally able to enter into these Terms and use SaleSync for business
          purposes. If you use the Service for an organization, you represent that you are
          authorized to accept these Terms for that organization. “You” includes that organization
          and its authorized users.
        </p>
      </LegalSection>

      <LegalSection title="2. Accounts and workspaces">
        <p>
          You must provide accurate account information, protect your credentials and recovery
          codes, and promptly report suspected unauthorized access. Workspace administrators control
          membership, roles, connected services, and workspace content. You are responsible for the
          actions of users you authorize and for maintaining appropriate permissions.
        </p>
      </LegalSection>

      <LegalSection title="3. Permitted use">
        <p>You may use SaleSync to manage legitimate sales activity. You may not:</p>
        <ul className={legalListClass}>
          <li>use the Service for unlawful, fraudulent, deceptive, or abusive activity;</li>
          <li>send spam or communications that violate consent, marketing, or privacy laws;</li>
          <li>upload data you do not have the right to use or process;</li>
          <li>impersonate others or misrepresent your identity or affiliation;</li>
          <li>probe, disrupt, overload, reverse engineer, or bypass Service security or limits;</li>
          <li>
            use automated collection methods that violate a third party’s terms or applicable law;
            or
          </li>
          <li>use the Service to create or distribute malicious code or harmful content.</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Customer content and data responsibility">
        <p>
          You retain ownership of content you submit to SaleSync. You grant us a limited license to
          host, process, transmit, display, and reproduce that content only as needed to provide,
          secure, and support the Service. You are responsible for the legality, accuracy, and
          quality of your content and for obtaining required notices, permissions, and consent from
          prospects, contacts, and other individuals.
        </p>
      </LegalSection>

      <LegalSection title="5. AI-assisted features">
        <p>
          SaleSync may generate drafts, summaries, recommendations, classifications, and proposed
          actions using artificial intelligence. AI output may be inaccurate, incomplete, or
          unsuitable. You must review output before relying on it or sending it externally. You
          remain responsible for decisions, messages, and actions taken through your account.
          SaleSync does not guarantee sales outcomes, lead quality, or the accuracy of AI-generated
          content.
        </p>
      </LegalSection>

      <LegalSection title="6. Email, meetings, and third-party services">
        <p>
          Connected services such as Google, email providers, calendars, conferencing, and lead-data
          providers are governed by their own terms and policies. You authorize SaleSync to take
          actions in those services when you request them. We are not responsible for third-party
          service availability, changes, or data. You are responsible for complying with applicable
          anti-spam, telemarketing, privacy, recording, and marketing laws.
        </p>
      </LegalSection>

      <LegalSection title="7. Service availability and changes">
        <p>
          We may improve, modify, suspend, or discontinue features and may apply reasonable usage,
          security, or technical limits. We aim to provide reliable service but do not promise that
          it will always be uninterrupted or error-free. Planned and emergency maintenance may
          affect availability.
        </p>
      </LegalSection>

      <LegalSection title="8. Fees">
        <p>
          If you purchase a paid plan, you agree to the pricing, billing interval, limits, and
          renewal terms presented at checkout or in an order form. Fees are non-refundable except
          where required by law or expressly agreed in writing. Taxes are your responsibility unless
          stated otherwise.
        </p>
      </LegalSection>

      <LegalSection title="9. Intellectual property">
        <p>
          SaleSync and its software, visual design, documentation, trademarks, and related
          materials are owned by us or our licensors. Except for the limited right to use the
          Service under these Terms, no rights are transferred to you. Feedback may be used to
          improve the Service without restriction or obligation.
        </p>
      </LegalSection>

      <LegalSection title="10. Suspension and termination">
        <p>
          You may stop using the Service at any time. We may restrict or suspend access when
          reasonably necessary to address security risks, unlawful conduct, non-payment, material
          breach, or harm to the Service or others. Upon termination, your right to use the Service
          ends. Provisions that by their nature should survive will remain in effect.
        </p>
      </LegalSection>

      <LegalSection title="11. Disclaimers and liability">
        <p>
          To the extent permitted by law, the Service is provided “as is” and “as available,”
          without warranties of merchantability, fitness for a particular purpose, non-infringement,
          or uninterrupted operation. To the extent permitted by law, SaleSync will not be liable
          for indirect, incidental, special, consequential, exemplary, or punitive damages, or loss
          of profits, revenue, goodwill, or data. Any liability that cannot legally be excluded
          remains limited to the maximum extent the law permits.
        </p>
      </LegalSection>

      <LegalSection title="12. Changes and contact">
        <p>
          We may update these Terms and will post the revised effective date. Material changes will
          be communicated when required. Continued use after an update means you accept the revised
          Terms. For questions, contact us through the support channel in your SaleSync workspace.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
