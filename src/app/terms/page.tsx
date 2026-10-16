import type { Metadata } from "next";
import LegalPage from "../../components/legal/LegalPage";

export const metadata: Metadata = { title: "Terms of Service | Wonderscore" };

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      updated="17 October 2026"
      intro="These terms apply when you use Wonderscore, a service that measures how often AI assistants such as ChatGPT, Claude, Gemini and Perplexity recommend your business, and suggests what to improve. By creating an account or using the service you agree to them."
      sections={[
        { heading: "Your account", body: ["You must give accurate details and keep your password safe. You are responsible for what happens under your account. You must be old enough to enter a contract where you live, and you may only add businesses you own or are authorised to manage."] },
        { heading: "What the service does", body: ["Wonderscore reads your public website, writes questions that customers might ask an AI assistant, asks those questions to AI models, and reports whether and how your business is mentioned. It also produces a score, a plan and draft articles.", "Results come from AI models and can vary from one run to the next, and they can be wrong. Scores, rankings and drafts are guidance, not a guarantee of results, and you should check every claim in a draft article against your own records before publishing it."] },
        { heading: "Early access and plans", body: ["The service is in early access and is currently free. Features may change, and paid plans may be introduced. If we introduce charges we will tell you first and you will not be charged for anything you have not agreed to."] },
        { heading: "Acceptable use", body: ["Do not misuse the service: no attempts to break or overload it, to access other people's data, to resell it without permission, or to submit websites or content you have no right to use. We may limit or suspend accounts that do."] },
        { heading: "Your content", body: ["You keep ownership of your business information and of the articles you create with the service. You give us permission to process them to provide the service, including sending relevant parts to the AI providers we use."] },
        { heading: "Shared reports", body: ["If you create a report link, anyone with the link can see that report until the link expires or you turn it off. Only share it with people you are happy to show it to."] },
        { heading: "Availability and liability", body: ["We work to keep the service running but do not promise it will always be available or error-free. To the extent the law allows, we are not liable for indirect or lost-profit losses, or for decisions you make based on a score or draft. Nothing in these terms limits any right you have that cannot be limited by law."] },
        { heading: "Ending your account", body: ["You can stop using the service at any time and ask us to delete your account. We may suspend or close an account that breaks these terms."] },
        { heading: "Changes", body: ["We may update these terms. If a change matters, we will tell you by email or in the app. Continuing to use the service after a change means you accept it."] },
      ]}
    />
  );
}
