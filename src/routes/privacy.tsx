import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, LegalSection, legalListClass } from "@/components/legal/LegalPage";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy | SalesSync" },
      {
        name: "description",
        content: "How SalesSync collects, uses, shares, and protects personal information.",
      },
    ],
  }),
  component: PrivacyPolicy,
});

function PrivacyPolicy() {
  return (
    <LegalPage
      title="Privacy Policy"
      description="This policy explains how SalesSync handles information when you use our sales workflow, outreach, meeting, and AI-assistance services."
      effectiveDate="October 18, 2026"
    >
      <LegalSection title="1. Scope">
        <p>
          This Privacy Policy applies to the SalesSync website, application, APIs, and related
          services (collectively, the “Service”). It applies to workspace owners, administrators,
          members, and visitors. If your organization provides your account, it may separately
          control the information in its workspace.
        </p>
      </LegalSection>

      <LegalSection title="2. Information we collect">
        <ul className={legalListClass}>
          <li>
            <strong>Account information:</strong> name, email address, company, job title, login
            method, workspace membership, role, and authentication and security records.
          </li>
          <li>
            <strong>Sales workspace content:</strong> customer profiles, leads, contacts, account
            details, ideal customer profiles, emails and drafts, sequences, deals, meetings,
            proposals, tasks, notes, and knowledge-base content you submit or generate.
          </li>
          <li>
            <strong>Integration data:</strong> information received when you connect services such
            as Google, Gmail, Google Calendar, or lead-data providers, subject to the permissions
            you approve.
          </li>
          <li>
            <strong>Usage and device information:</strong> feature activity, audit events, browser
            and device details, IP address, diagnostic data, and error and performance logs.
          </li>
          <li>
            <strong>Communications:</strong> messages you send to support and feedback you provide.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="3. How we use information">
        <p>We use information to:</p>
        <ul className={legalListClass}>
          <li>provide, secure, maintain, and improve the Service;</li>
          <li>authenticate users and administer workspaces, roles, and permissions;</li>
          <li>create and manage outreach, meetings, pipelines, proposals, and related records;</li>
          <li>generate requested AI-assisted drafts, summaries, suggestions, and actions;</li>
          <li>send service messages and respond to support requests;</li>
          <li>
            detect abuse, investigate incidents, enforce our Terms, and meet legal obligations; and
          </li>
          <li>analyze product performance using aggregated or de-identified information.</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Google user data">
        <p>
          When you connect a Google account, SalesSync accesses only the data covered by the scopes
          you approve. Depending on the features you enable, this may include your basic Google
          profile, Gmail messages and sending capability, and Google Calendar events.
        </p>
        <ul className={legalListClass}>
          <li>
            Gmail data is used to send user-requested outreach and to detect relevant replies or
            delivery events for SalesSync records.
          </li>
          <li>
            Calendar data is used to create, display, update, and cancel meetings and generate
            Google Meet conferencing links at your request.
          </li>
          <li>
            Google data is not sold, used for personalized advertising, or used to build advertising
            profiles.
          </li>
          <li>
            Access tokens are protected and used only to provide the connected features. You may
            disconnect Google in SalesSync settings or revoke access from your Google Account.
          </li>
        </ul>
        <p>
          SalesSync’s use and transfer of information received from Google APIs adheres to the{" "}
          <a
            href="https://developers.google.com/terms/api-services-user-data-policy"
            className="font-medium text-[#155eef] underline underline-offset-2"
            target="_blank"
            rel="noreferrer"
          >
            Google API Services User Data Policy
          </a>
          , including the Limited Use requirements.
        </p>
      </LegalSection>

      <LegalSection title="5. How we share information">
        <p>We may share information only as needed with:</p>
        <ul className={legalListClass}>
          <li>
            <strong>Your workspace:</strong> authorized members according to their roles and access
            permissions.
          </li>
          <li>
            <strong>Service providers:</strong> vendors that support hosting, databases, email
            delivery, AI processing, error monitoring, security, and connected integrations under
            contractual or other applicable safeguards.
          </li>
          <li>
            <strong>Legal and safety recipients:</strong> authorities or other parties when required
            by law or reasonably necessary to protect rights, safety, and the integrity of the
            Service.
          </li>
          <li>
            <strong>Business transfers:</strong> a successor in connection with a merger,
            acquisition, financing, reorganization, or sale of assets, subject to appropriate
            confidentiality protections.
          </li>
        </ul>
        <p>We do not sell personal information.</p>
      </LegalSection>

      <LegalSection title="6. Data retention and security">
        <p>
          We retain information for as long as necessary to provide the Service, fulfill the
          purposes described here, comply with legal obligations, resolve disputes, and enforce
          agreements. Retention periods depend on the type of information and workspace settings. We
          use administrative, technical, and organizational safeguards designed to protect
          information, but no system can guarantee absolute security.
        </p>
      </LegalSection>

      <LegalSection title="7. Your choices and rights">
        <p>
          Depending on your location, you may have rights to access, correct, delete, restrict, or
          export personal information, or object to certain processing. You can update profile and
          integration settings in the Service. Workspace-controlled data requests may need to be
          directed to your organization’s administrator. You may also revoke connected third-party
          services at any time.
        </p>
      </LegalSection>

      <LegalSection title="8. International processing and children">
        <p>
          Information may be processed in countries other than where you live, subject to applicable
          safeguards. The Service is designed for business users and is not directed to children
          under 13 or the minimum age required by local law.
        </p>
      </LegalSection>

      <LegalSection title="9. Changes and contact">
        <p>
          We may update this policy as our Service or legal obligations change. We will post the new
          effective date and provide additional notice when required. For privacy questions or
          requests, contact us through the support channel in your SalesSync workspace.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
