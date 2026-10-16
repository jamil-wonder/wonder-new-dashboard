import type { Metadata } from "next";
import LegalPage from "../../components/legal/LegalPage";

export const metadata: Metadata = { title: "Privacy Policy | Wonderscore" };

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="17 October 2026"
      intro="This explains what Wonderscore collects, why, and the choices you have. We collect only what we need to run the service."
      sections={[
        { heading: "What we collect", body: ["Account details: your name, email address and a password (stored hashed), or your Google account name and email if you sign in with Google.", "Business details you give us or we read from your public website: business name, website address, category, location, description, services, competitors and the questions we track for you.", "Results of scans and AI answers about your business, your scores over time, the articles we draft for you, and your settings.", "Basic technical data needed to run and secure the service, such as request logs."] },
        { heading: "How we use it", body: ["To run scans, calculate your score, show your results, draft articles, and send you emails you would expect: sign-up and verification codes, password resets, a welcome message, and scan-complete or weekly summaries (you can turn the scan-complete emails off in Settings).", "To keep the service secure, fix problems and improve it. We do not sell your data and we do not use it for advertising."] },
        { heading: "AI providers", body: ["To produce results we send your business name, website address, category, location, description and the tracked questions to AI providers (currently OpenAI, Anthropic, Google and Perplexity). They process this to return answers. We do not send your password or payment details to them."] },
        { heading: "Who else sees it", body: ["Only our service providers who help us run Wonderscore (hosting, database and email delivery), and anyone you choose to share a report link with. We may disclose information if the law requires it."] },
        { heading: "Shared reports", body: ["A report link shows a business's score, areas and competitors to anyone who has the link, until it expires (30 days) or you turn it off. It is not listed by search engines."] },
        { heading: "Keeping and deleting data", body: ["We keep your data while your account is open. You can ask us to delete your account and the data tied to it by writing to support@wonderscore.ai."] },
        { heading: "Your choices", body: ["You can ask to see, correct, export or delete the personal data we hold about you, and you can turn off non-essential emails in Settings. Write to us and we will help."] },
        { heading: "Cookies and storage", body: ["We use your browser's local storage to keep you signed in and remember simple preferences. We do not use advertising cookies."] },
        { heading: "Changes", body: ["If we change this policy in a way that matters, we will tell you by email or in the app."] },
      ]}
    />
  );
}
