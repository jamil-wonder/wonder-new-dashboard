import Link from "next/link";

export interface LegalSection {
  heading: string;
  body: string[];
}

// H5: plain page shell for the Terms and Privacy Policy - readable without an account.
export default function LegalPage({ title, updated, intro, sections }: { title: string; updated: string; intro: string; sections: LegalSection[] }) {
  return (
    <div className="min-h-screen bg-[#faf8f3] px-4 py-10 md:py-16">
      <main className="mx-auto w-full max-w-[720px] rounded-[24px] border border-[#ece3d1] bg-white p-6 md:p-10">
        <Link href="/auth" className="text-[13px] font-semibold text-[#15463b] hover:underline">&larr; Back to Wonderscore</Link>
        <h1 className="mt-5 font-spectral text-[30px] font-semibold leading-tight text-[#15463b]">{title}</h1>
        <p className="mt-1 text-[12.5px] text-[#6f6757]">Last updated {updated}</p>
        <p className="mt-5 text-[14.5px] leading-relaxed text-[#2c2821]">{intro}</p>
        {sections.map((s, i) => (
          <section key={s.heading} className="mt-7">
            <h2 className="font-spectral text-[19px] font-semibold text-[#15463b]">{i + 1}. {s.heading}</h2>
            {s.body.map((p) => (
              <p key={p} className="mt-2 text-[14.5px] leading-relaxed text-[#2c2821]">{p}</p>
            ))}
          </section>
        ))}
        <p className="mt-9 border-t border-[#efe7d6] pt-5 text-[13px] text-[#6f6757]">
          Questions? Write to <a className="font-semibold text-[#15463b] hover:underline" href="mailto:support@wonderscore.ai">support@wonderscore.ai</a>.
          See also our <Link className="font-semibold text-[#15463b] hover:underline" href="/terms">Terms</Link> and <Link className="font-semibold text-[#15463b] hover:underline" href="/privacy">Privacy Policy</Link>.
        </p>
      </main>
    </div>
  );
}
