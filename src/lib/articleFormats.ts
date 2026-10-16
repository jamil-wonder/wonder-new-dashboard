// F5 / F8: an article's text is light markdown (## headings, - bullets, **bold**, *italic*, [links](https://...)).
// This turns it into blocks that are drawn as real formatting (never as raw HTML), and into the file
// formats an owner needs: Markdown, HTML and Word (.docx).

export type Inline = { kind: "text" | "bold" | "italic" | "link"; text: string; href?: string };
export type Block =
  | { kind: "heading"; level: 2 | 3 | 4; inlines: Inline[] }
  | { kind: "paragraph"; inlines: Inline[] }
  | { kind: "list"; ordered: boolean; items: Inline[][] };

const SAFE_LINK = /^https?:\/\/[^\s<>"']+$/i;

export function parseInline(text: string): Inline[] {
  const out: Inline[] = [];
  const re = /\*\*([^*]+)\*\*|\*([^*\s][^*]*)\*|_([^_\s][^_]*)_|\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push({ kind: "text", text: text.slice(last, m.index) });
    if (m[1] !== undefined) out.push({ kind: "bold", text: m[1] });
    else if (m[2] !== undefined || m[3] !== undefined) out.push({ kind: "italic", text: m[2] ?? m[3] });
    else if (SAFE_LINK.test(m[5])) out.push({ kind: "link", text: m[4], href: m[5] });
    else out.push({ kind: "text", text: m[4] }); // a link that isn't http(s): keep the words, drop the address
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ kind: "text", text: text.slice(last) });
  return out;
}

export function parseMarkdown(src: string): Block[] {
  const blocks: Block[] = [];
  const lines = String(src || "").replace(/\r\n?/g, "\n").split("\n");
  let para: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  const flushPara = () => {
    if (para.length) blocks.push({ kind: "paragraph", inlines: parseInline(para.join(" ").trim()) });
    para = [];
  };
  const flushList = () => {
    if (list) blocks.push({ kind: "list", ordered: list.ordered, items: list.items.map(parseInline) });
    list = null;
  };
  for (const raw of lines) {
    const line = raw.trimEnd();
    const h = /^(#{1,4})\s+(.*)$/.exec(line);
    const ul = /^\s*[-*•]\s+(.*)$/.exec(line);
    const ol = /^\s*\d+[.)]\s+(.*)$/.exec(line);
    if (!line.trim()) {
      flushPara();
      flushList();
    } else if (h) {
      flushPara();
      flushList();
      blocks.push({ kind: "heading", level: Math.min(4, Math.max(2, h[1].length + 1)) as 2 | 3 | 4, inlines: parseInline(h[2]) });
    } else if (ul || ol) {
      flushPara();
      const ordered = Boolean(ol);
      if (!list || list.ordered !== ordered) {
        flushList();
        list = { ordered, items: [] };
      }
      list.items.push((ul || ol)![1]);
    } else {
      flushList();
      para.push(line.trim());
    }
  }
  flushPara();
  flushList();
  return blocks;
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function inlineHtml(inlines: Inline[]): string {
  return inlines
    .map((i) =>
      i.kind === "bold" ? `<strong>${esc(i.text)}</strong>`
      : i.kind === "italic" ? `<em>${esc(i.text)}</em>`
      : i.kind === "link" ? `<a href="${esc(i.href || "")}">${esc(i.text)}</a>`
      : esc(i.text))
    .join("");
}

export interface ArticleParts {
  title: string;
  metaDescription?: string;
  sections: { heading: string; content: string }[];
}

export function articleToMarkdown(a: ArticleParts): string {
  return [`# ${a.title}`, a.metaDescription ? `*${a.metaDescription}*` : "", ...a.sections.map((s) => `## ${s.heading}\n\n${s.content}`)]
    .filter(Boolean)
    .join("\n\n");
}

export function articleToHtml(a: ArticleParts): string {
  const body = a.sections
    .map((s) => {
      const blocks = parseMarkdown(s.content)
        .map((b) =>
          b.kind === "heading" ? `<h${b.level + 1}>${inlineHtml(b.inlines)}</h${b.level + 1}>`
          : b.kind === "list" ? `<${b.ordered ? "ol" : "ul"}>${b.items.map((it) => `<li>${inlineHtml(it)}</li>`).join("")}</${b.ordered ? "ol" : "ul"}>`
          : `<p>${inlineHtml(b.inlines)}</p>`)
        .join("\n");
      return `<h2>${esc(s.heading)}</h2>\n${blocks}`;
    })
    .join("\n");
  return `<h1>${esc(a.title)}</h1>\n${a.metaDescription ? `<p><em>${esc(a.metaDescription)}</em></p>\n` : ""}${body}`;
}

/* ───────────── a minimal .docx (a zip of three small XML files, stored without compression) ───────────── */

function crc32(bytes: Uint8Array): number {
  let c = ~0;
  for (let i = 0; i < bytes.length; i++) {
    c ^= bytes[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function zipStore(files: { name: string; data: Uint8Array }[]): Uint8Array {
  const enc = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;
  const u16 = (n: number) => [n & 255, (n >>> 8) & 255];
  const u32 = (n: number) => [n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255];
  for (const f of files) {
    const name = enc.encode(f.name);
    const crc = crc32(f.data);
    const local = new Uint8Array([...u32(0x04034b50), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0x21), ...u32(crc), ...u32(f.data.length), ...u32(f.data.length), ...u16(name.length), ...u16(0), ...name]);
    chunks.push(local, f.data);
    central.push(new Uint8Array([...u32(0x02014b50), ...u16(20), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0x21), ...u32(crc), ...u32(f.data.length), ...u32(f.data.length), ...u16(name.length), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(0), ...u32(offset), ...name]));
    offset += local.length + f.data.length;
  }
  const centralSize = central.reduce((n, c) => n + c.length, 0);
  const end = new Uint8Array([...u32(0x06054b50), ...u16(0), ...u16(0), ...u16(files.length), ...u16(files.length), ...u32(centralSize), ...u32(offset), ...u16(0)]);
  const all = [...chunks, ...central, end];
  const out = new Uint8Array(all.reduce((n, c) => n + c.length, 0));
  let p = 0;
  for (const c of all) {
    out.set(c, p);
    p += c.length;
  }
  return out;
}

const xml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function run(i: Inline): string {
  const props = i.kind === "bold" ? "<w:rPr><w:b/></w:rPr>" : i.kind === "italic" ? "<w:rPr><w:i/></w:rPr>" : i.kind === "link" ? '<w:rPr><w:u w:val="single"/></w:rPr>' : "";
  return `<w:r>${props}<w:t xml:space="preserve">${xml(i.kind === "link" ? `${i.text} (${i.href})` : i.text)}</w:t></w:r>`;
}
const para = (inlines: Inline[], style?: string) =>
  `<w:p>${style ? `<w:pPr><w:pStyle w:val="${style}"/></w:pPr>` : ""}${inlines.map(run).join("")}</w:p>`;

export function articleToDocx(a: ArticleParts): Blob {
  const body: string[] = [para([{ kind: "text", text: a.title }], "Title")];
  if (a.metaDescription) body.push(para([{ kind: "italic", text: a.metaDescription }]));
  for (const s of a.sections) {
    body.push(para([{ kind: "text", text: s.heading }], "Heading1"));
    for (const b of parseMarkdown(s.content)) {
      if (b.kind === "heading") body.push(para(b.inlines, b.level >= 3 ? "Heading3" : "Heading2"));
      else if (b.kind === "list") b.items.forEach((it, n) => body.push(para([{ kind: "text", text: b.ordered ? `${n + 1}. ` : "• " }, ...it])));
      else body.push(para(b.inlines));
    }
  }
  const enc = new TextEncoder();
  const doc = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body.join("")}</w:body></w:document>`;
  const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:rPr><w:sz w:val="22"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:rPr><w:b/><w:sz w:val="44"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:rPr><w:b/><w:sz w:val="32"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:rPr><w:b/><w:sz w:val="28"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading3"><w:name w:val="heading 3"/><w:rPr><w:b/><w:sz w:val="24"/></w:rPr></w:style></w:styles>`;
  const types = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>`;
  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`;
  const docRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`;
  const zip = zipStore([
    { name: "[Content_Types].xml", data: enc.encode(types) },
    { name: "_rels/.rels", data: enc.encode(rels) },
    { name: "word/document.xml", data: enc.encode(doc) },
    { name: "word/_rels/document.xml.rels", data: enc.encode(docRels) },
    { name: "word/styles.xml", data: enc.encode(styles) },
  ]);
  return new Blob([zip as BlobPart], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
}

export function fileSafeName(title: string): string {
  return (title || "article").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "article";
}
