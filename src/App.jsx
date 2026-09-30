import { useEffect, useRef, useState } from "react";
import { PortableText } from "@portabletext/react";
import { ArrowRight, CalendarDays, Handshake, HeartHandshake, Menu, UsersRound, X } from "./icons.jsx";
import { getFeaturedProjects, getUpcomingEvents } from "./content.js";
import { loadPublishedContent } from "./sanity.js";

const navigation = [
  ["Startseite", "/"], ["Über uns", "/verein/"], ["Projekte", "/projekte/"],
  ["Termine", "/termine/"], ["Partner", "/partner/"], ["Mitmachen", "/mitmachen/"], ["Kontakt", "/kontakt/"],
];
const baseUrl = import.meta.env.BASE_URL;
const siteUrl = (path) => `${baseUrl}${path.replace(/^\/+/, "")}`;
const formAccessKey = "47090194-73d1-438b-9cd8-6a87e50d579b";
const formatDate = (date) => new Intl.DateTimeFormat("de-DE", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Berlin" }).format(new Date(date));
const articleUrl = (slug) => `${siteUrl('/projekte/')}?beitrag=${encodeURIComponent(slug)}`;
const articleComponents = {
  types: {
    image: ({value}) => value.imageUrl ? <figure className="article-inline-image"><img src={value.imageUrl} alt={value.alt || ''} loading="lazy" />{(value.caption || value.credit) && <figcaption>{value.caption}{value.caption && value.credit && <span> · </span>}{value.credit && <span>{value.credit}</span>}</figcaption>}</figure> : null,
  },
};

async function submitForm(form, subject) {
  const fields = Object.fromEntries(new FormData(form));
  const response = await fetch("https://api.web3forms.com/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ ...fields, access_key: formAccessKey, subject, from_name: "Moinander Website" }),
  });
  const result = await response.json();
  if (!response.ok || !result.success) throw new Error(result.message || "Die Nachricht konnte nicht gesendet werden.");
}

function Logo() {
  return <a className="brand" href={siteUrl("/")} aria-label="Moinander – zur Startseite"><img src={siteUrl("/assets/logo.png")} alt="Moinander" /></a>;
}

const detailPages = {
  verein: {
    eyebrow: "ÜBER UNS", title: "Moinander bringt Menschen und Möglichkeiten zusammen.",
    intro: "Wir sind ein neu gegründeter Förderverein für Sport, Jugend und Gemeinschaft in unserer Region.",
  },
  projekte: {
    eyebrow: "PROJEKTE & EINBLICKE", title: "Ideen brauchen Menschen, die sie möglich machen.",
    intro: "Hier wachsen die Beiträge über Vorhaben, die wir fördern, begleiten oder aus der Region vorstellen. Jede Idee kann einen anderen Weg nehmen.",
  },
  termine: {
    eyebrow: "TERMINE", title: "Gemeinsam vor Ort.",
    intro: "Veranstaltungen, Aktionen und Möglichkeiten zum Mitmachen bekommen hier ihren eigenen Platz, sobald die Daten feststehen.",
  },
  partner: {
    eyebrow: "PARTNER & SPONSOREN", title: "Gemeinsam wird mehr möglich.",
    intro: "Unterstützung kann viele Formen haben: Ausstattung, Zeit, Wissen oder eine gute Verbindung. Hier stellen wir künftig die Menschen und Organisationen vor, die mit uns zusammenarbeiten.",
  },
  mitmachen: {
    eyebrow: "MITMACHEN", title: "Bring dich ein. Auf deine Weise.",
    intro: "Moinander lebt von Menschen, die sich für Sport, Jugend und Gemeinschaft einsetzen möchten. Eine Idee, tatkräftige Hilfe oder Förderung können viel bewegen.",
  },
  kontakt: {
    eyebrow: "KONTAKT", title: "Lass uns ins Gespräch kommen.",
    intro: "Du hast eine Frage, eine Idee oder möchtest Moinander kennenlernen? Schreib uns eine Nachricht.",
  },
};

function ContactForm() {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const handleSubmit = async (event) => {
    event.preventDefault();
    setSending(true);
    setError("");
    try { await submitForm(event.currentTarget, "Kontaktanfrage über moinander.de"); setSent(true); }
    catch (cause) { setError(cause.message || "Bitte versuche es später erneut."); }
    finally { setSending(false); }
  };
  return sent ? <div className="form-message" role="status"><strong>Danke für deine Nachricht!</strong><p>Deine Nachricht wurde an Moinander übermittelt.</p><button className="text-link reset-link" type="button" onClick={() => setSent(false)}>Weitere Nachricht schreiben <ArrowRight size={18} /></button></div> : <form className="form-grid" onSubmit={handleSubmit}><label>Dein Name<input required name="name" autoComplete="name" /></label><label>E-Mail-Adresse<input required type="email" name="email" autoComplete="email" /></label><label className="full">Deine Nachricht<textarea required name="message" rows="5" /></label><input className="honeypot" type="checkbox" name="botcheck" tabIndex="-1" autoComplete="off" aria-hidden="true" />{error && <p className="form-error full" role="alert">{error}</p>}<button className="button button-dark form-submit" type="submit" disabled={sending}>{sending ? "Wird gesendet…" : "Nachricht senden"} <ArrowRight size={18} /></button></form>;
}

function DetailPage({ page, openProposal, projects, events, partners, board }) {
  const info = detailPages[page];
  const articleSlug = new URLSearchParams(window.location.search).get('beitrag');
  const article = page === 'projekte' ? projects.find((item) => item.slug === articleSlug) : null;
  return <main className="detail-main">
    <section className="detail-hero page-gutter"><p className="eyebrow lime">{info.eyebrow}</p><h1>{info.title}</h1><p>{info.intro}</p><a className="detail-back" href={siteUrl("/")}>← Zur Startseite</a></section>
    {page === "verein" && <>
      <nav className="section-nav page-gutter" aria-label="Auf dieser Seite"><span>Auf dieser Seite</span><a href="#ziele">Unsere Ziele</a><a href="#vorstand">Vorstand</a></nav>
      <section className="section association-section page-gutter" id="ziele"><div className="section-heading"><p className="eyebrow blue">UNSERE ZIELE</p><h2>Gute Ideen sollen weiterkommen.</h2></div><p className="lead">Moinander e.V. möchte Menschen vernetzen, Ressourcen bündeln und Projekte für Sport, Jugend und Gemeinschaft möglich machen. Als Förderverein unterstützen wir Engagement dort, wo es einen Unterschied machen kann.</p><a className="text-link" href={siteUrl("/projekte/")}>Projekte & Einblicke ansehen <ArrowRight size={18} /></a></section>
      <section className="section board-section page-gutter" id="vorstand"><div className="section-heading"><p className="eyebrow blue">DER VEREIN</p><h2>Der gewählte Vorstand.</h2><p>Die Porträts ergänzen wir, sobald passende Fotos vorliegen.</p></div><div className="board board-full">{(board.length ? board : [{id:'christopher',name:'Christopher Harms',role:'1. Vorsitzender'},{id:'liesa',name:'Liesa',role:'2. Vorsitzende'},{id:'martina',name:'Martina Harms',role:'Schatzmeisterin'}]).map((member) => <div key={member.id}>{member.portraitUrl && <img className="board-portrait" src={member.portraitUrl} alt={member.portraitAlt || member.name} />}<strong>{member.name}</strong><span>{member.role}</span></div>)}</div></section>
      <section className="detail-cta page-gutter"><div><p className="eyebrow blue">MITMACHEN</p><h2>Du möchtest Teil davon sein?</h2><p>Erfahre, wie du dich mit Ideen, Zeit oder Förderung einbringen kannst.</p></div><a className="button button-dark" href={siteUrl("/mitmachen/")}>Möglichkeiten entdecken <ArrowRight size={18} /></a></section>
    </>}
    {page === "projekte" && <>
      {article ? <article className={`section detail-section page-gutter project-article article-template-${["short", "photo", "feature"].includes(article.articleTemplate) ? article.articleTemplate : "feature"}`}><a className="detail-back" href={siteUrl('/projekte/')}>← Alle Projekte</a>{article.imageUrl && <img className="article-image" src={article.imageUrl} alt={article.imageAlt || ''} />}<p className="eyebrow blue">{article.kind || 'PROJEKT'}</p><h2>{article.title}</h2><p className="lead">{article.description}</p>{article.body?.length > 0 && <div className="article-body"><PortableText value={article.body} components={articleComponents} /></div>}</article> : <section className="section detail-section page-gutter"><div className="section-heading"><p className="eyebrow blue">WAS HIER ENTSTEHT</p><h2>Raum für unterschiedliche Vorhaben.</h2><p>Hier veröffentlichen wir Beiträge über Projekte, Förderideen und Initiativen aus der Region.</p></div>{projects.length ? <div className="project-list">{projects.map(({ id, slug, kind, title, description }, index) => <article className="project-row" key={id}><span className="project-number">0{index + 1}</span><div><span className="project-kind">{kind}</span><h3>{slug ? <a href={articleUrl(slug)}>{title}</a> : title}</h3><p>{description}</p></div></article>)}</div> : <div className="empty-state"><UsersRound size={36} /><h3>Die ersten Beiträge entstehen</h3><p>Wir ergänzen Projekte und Einblicke, sobald sie veröffentlicht werden können.</p></div>}</section>}
      <section className="detail-cta page-gutter"><div><p className="eyebrow blue">DEINE IDEE</p><h2>Was sollten wir gemeinsam anpacken?</h2><p>Erzähl uns, welches Projekt du im Kopf hast und welche Unterstützung sinnvoll wäre.</p></div><button className="button button-dark" type="button" onClick={openProposal}>Projekt vorschlagen <ArrowRight size={18} /></button></section>
    </>}
    {page === "termine" && <>
      <section className="section detail-section page-gutter"><div className="section-heading"><p className="eyebrow blue">KALENDER</p><h2>Die nächsten Termine.</h2></div>{getUpcomingEvents(events).length ? <div className="event-list">{getUpcomingEvents(events).map((event) => <article className="event-row" key={event.id}><time dateTime={event.startsAt}>{formatDate(event.startsAt)}</time><div><h3>{event.title}</h3><p>{event.summary}</p>{event.location && <p>{event.location}</p>}{event.link && <a className="text-link" href={event.link} target="_blank" rel="noopener noreferrer">Weitere Informationen <ArrowRight size={18} /></a>}</div></article>)}</div> : <div className="empty-state"><CalendarDays size={36} /><h3>Noch keine öffentlichen Termine</h3><p>Sobald Veranstaltungen oder Aktionen feststehen, veröffentlichen wir sie hier mit allen wichtigen Informationen.</p></div>}</section>
      <section className="detail-cta page-gutter"><div><p className="eyebrow blue">VERANSTALTUNGEN</p><h2>Du planst etwas mit uns?</h2><p>Ob Schulsport, Vereinsaktion oder Begegnung in der Region: Wir freuen uns über deine Nachricht.</p></div><a className="button button-dark" href={siteUrl("/kontakt/")}>Kontakt aufnehmen <ArrowRight size={18} /></a></section>
    </>}
    {page === "partner" && <>
      <section className="section detail-section page-gutter"><div className="section-heading"><p className="eyebrow blue">ZUSAMMENARBEIT</p><h2>Unterstützung, die ankommt.</h2><p>Von Trikots und Sportmaterial bis zu neuen Kontakten: Gute Partnerschaften entstehen aus konkreten Ideen und gemeinsamen Zielen.</p></div><div className="detail-card-grid"><article><Handshake size={34} /><h3>Projektpartnerschaft</h3><p>Ein bestimmtes Vorhaben gemeinsam auf den Weg bringen.</p></article><article><HeartHandshake size={34} /><h3>Förderung</h3><p>Mit Mitteln, Material oder Erfahrung ein Projekt unterstützen.</p></article><article><UsersRound size={34} /><h3>Netzwerk</h3><p>Menschen, Schulen, Vereine und Unternehmen verbinden.</p></article></div>{partners.length ? <div className="partner-list">{partners.map((partner) => <article key={partner.id}>{partner.logoUrl && <img src={partner.logoUrl} alt={partner.logoAlt || partner.name} />}<span className="project-kind">{partner.kind}</span><h3>{partner.name}</h3>{partner.summary && <p>{partner.summary}</p>}{partner.website && <a className="text-link" href={partner.website} target="_blank" rel="noopener noreferrer">Webseite besuchen <ArrowRight size={18} /></a>}</article>)}</div> : <p className="detail-hint">Bestätigte Partner und Sponsoren stellen wir hier vor, sobald die Zusammenarbeit veröffentlicht werden kann.</p>}</section>
      <section className="detail-cta page-gutter"><div><p className="eyebrow blue">PARTNER WERDEN</p><h2>Lass uns Möglichkeiten besprechen.</h2></div><a className="button button-dark" href={siteUrl("/kontakt/")}>Kontakt aufnehmen <ArrowRight size={18} /></a></section>
    </>}
    {page === "mitmachen" && <>
      <section className="section detail-section page-gutter"><div className="section-heading"><p className="eyebrow blue">DEIN BEITRAG</p><h2>Es gibt mehr als einen Weg.</h2></div><div className="detail-card-grid"><article><UsersRound size={34} /><h3>Mitglied werden</h3><p>Als ordentliches Mitglied eigene Ideen einbringen und den Verein mitgestalten.</p></article><article><HeartHandshake size={34} /><h3>Fördermitglied werden</h3><p>Die Ziele des Vereins unterstützen und Projekte mit ermöglichen.</p></article><article><ArrowRight size={34} /><h3>Projekt vorschlagen</h3><p>Eine Idee für Sport, Jugend oder Gemeinschaft mit uns teilen.</p><button className="text-link" type="button" onClick={openProposal}>Idee einreichen <ArrowRight size={18} /></button></article></div></section>
      <section className="detail-cta page-gutter"><div><p className="eyebrow blue">KONTAKT</p><h2>Wie möchtest du dich einbringen?</h2><p>Schreib uns kurz, was dich interessiert. Wir freuen uns auf den Austausch.</p></div><a className="button button-dark" href={siteUrl("/kontakt/")}>Nachricht schreiben <ArrowRight size={18} /></a></section>
    </>}
    {page === "kontakt" && <section className="section contact-section page-gutter"><div><p className="eyebrow blue">DEINE NACHRICHT</p><h2>Wir freuen uns, von dir zu hören.</h2><p>Für Fragen zum Verein, eine mögliche Zusammenarbeit oder deine eigene Idee kannst du uns hier schreiben.</p><p className="contact-note">Du erreichst uns auch unter <a href="mailto:info@moinander.de">info@moinander.de</a>. Die Social-Media-Links ergänzen wir, sobald sie bereitstehen.</p></div><div className="contact-form-wrap"><ContactForm /></div></section>}
  </main>;
}

function ProposalDialog({ close }) {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const handleSubmit = async (event) => {
    event.preventDefault();
    setSending(true);
    setError("");
    try { await submitForm(event.currentTarget, "Projektvorschlag über moinander.de"); setSent(true); }
    catch (cause) { setError(cause.message || "Bitte versuche es später erneut."); }
    finally { setSending(false); }
  };
  useEffect(() => {
    const escape = (event) => { if (event.key === "Escape") close(); };
    document.addEventListener("keydown", escape);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", escape); document.body.style.overflow = ""; };
  }, [close]);
  return <div className="dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
    <section className="dialog" role="dialog" aria-modal="true" aria-labelledby="proposal-title">
      <button className="icon-button dialog-close" type="button" onClick={close} aria-label="Schließen"><X size={24} /></button>
      <p className="eyebrow blue">DEINE IDEE FÜR DIE REGION</p>
      <h2 id="proposal-title">Projekt vorschlagen</h2>
      {sent ? <div className="form-message" role="status"><strong>Danke für deinen Vorschlag!</strong><p>Deine Idee wurde an Moinander übermittelt.</p><button className="button button-dark" type="button" onClick={close}>Schließen</button></div> :
        <form className="form-grid" onSubmit={handleSubmit}>
          <p className="form-intro">Erzähl uns kurz, was du vorhast und wobei du Unterstützung suchst.</p>
          <label>Dein Name<input required name="name" autoComplete="name" /></label>
          <label>E-Mail-Adresse<input required name="email" type="email" autoComplete="email" /></label>
          <label className="full">Titel der Idee<input required name="title" /></label>
          <label className="full">Worum geht es?<textarea required name="description" rows="4" /></label>
          <label className="full">Welche Unterstützung wäre hilfreich?<textarea name="support" rows="3" /></label>
          <input className="honeypot" type="checkbox" name="botcheck" tabIndex="-1" autoComplete="off" aria-hidden="true" />
          {error && <p className="form-error full" role="alert">{error}</p>}
          <button className="button button-lime form-submit" type="submit" disabled={sending}>{sending ? "Wird gesendet…" : "Vorschlag senden"} <ArrowRight size={18} /></button>
        </form>}
    </section>
  </div>;
}

export function App() {
  const pathname = window.location.pathname;
  const relativePath = pathname.startsWith(baseUrl) ? pathname.slice(baseUrl.length) : pathname.replace(/^\/+/, "");
  const page = relativePath.split("/").filter(Boolean)[0];
  const isDetailPage = Boolean(detailPages[page]);
  const [content, setContent] = useState({ projects: [], events: [], partners: [], board: [] });
  const { projects, events, partners, board } = content;
  const nextEvent = getUpcomingEvents(events)[0];
  const [menuOpen, setMenuOpen] = useState(false);
  const [floatingMenuOpen, setFloatingMenuOpen] = useState(false);
  const [floatingVisible, setFloatingVisible] = useState(false);
  const [proposalOpen, setProposalOpen] = useState(false);
  const [backVisible, setBackVisible] = useState(false);
  const headerRef = useRef(null);
  const floatingButtonRef = useRef(null);
  const floatingPanelRef = useRef(null);
  useEffect(() => {
    const controller = new AbortController();
    loadPublishedContent(controller.signal).then(setContent).catch((error) => {
      if (error.name !== 'AbortError') console.error('Öffentliche Inhalte konnten nicht geladen werden:', error);
    });
    return () => controller.abort();
  }, []);
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const headerGone = (headerRef.current?.getBoundingClientRect().bottom ?? 1) <= 0;
      setFloatingVisible(headerGone);
      setBackVisible(y > Math.min(window.innerHeight * 0.75, 700));
      if (!headerGone) setFloatingMenuOpen(false);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); };
  }, []);
  useEffect(() => {
    if (!menuOpen) return;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event) => { if (event.key === "Escape") setMenuOpen(false); };
    document.addEventListener("keydown", closeOnEscape);
    return () => { document.body.style.overflow = ""; document.removeEventListener("keydown", closeOnEscape); };
  }, [menuOpen]);
  useEffect(() => {
    if (!floatingMenuOpen) return;
    document.body.style.overflow = "hidden";
    floatingPanelRef.current?.querySelector("a")?.focus();
    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setFloatingMenuOpen(false);
        floatingButtonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => { document.body.style.overflow = ""; document.removeEventListener("keydown", closeOnEscape); };
  }, [floatingMenuOpen]);
  const openProposal = () => { setMenuOpen(false); setFloatingMenuOpen(false); setProposalOpen(true); };
  const closeProposal = () => setProposalOpen(false);
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  return <>
    <div className="site-shell" id="start">
        <header className="site-header page-gutter" ref={headerRef}>
          <Logo />
          <nav className={menuOpen ? "main-nav open" : "main-nav"} aria-label="Hauptnavigation">
            {navigation.map(([label, href]) => <a key={label} href={siteUrl(href)} aria-current={href === (isDetailPage ? `/${page}/` : "/") ? "page" : undefined} onClick={() => setMenuOpen(false)}>{label}</a>)}
            <button className="mobile-proposal" type="button" onClick={openProposal}>Projekt vorschlagen <ArrowRight size={18} /></button>
          </nav>
          <button className="menu-toggle icon-button" type="button" aria-label={menuOpen ? "Menü schließen" : "Menü öffnen"} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={28} /> : <Menu size={28} />}</button>
        </header>
      <div className="top">
        {!isDetailPage && <section className="hero page-gutter" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow lime">FÖRDERVEREIN FÜR SPORT, JUGEND UND GEMEINSCHAFT</p>
            <h1 id="hero-title">Zusammen<br />bringen wir mehr<br /><span>in Bewegung.</span></h1>
            <p className="hero-intro">Wir verbinden Menschen, stärken den Zusammenhalt und helfen, gute Ideen für Sport, Jugend und Gemeinschaft in unserer Region Wirklichkeit werden zu lassen.</p>
            <div className="hero-actions"><button className="button button-lime" type="button" onClick={openProposal}>Projekt vorschlagen <ArrowRight size={19} /></button><a className="button button-outline" href={siteUrl("/verein/")}>Mehr über uns <ArrowRight size={19} /></a></div>
          </div>
          <div className="hero-visual"><img src={siteUrl("/assets/hero-rugby.png")} alt="Junge Rugbyspielerin klatscht mit einem Trainer ab" /></div>
        </section>}
      </div>
      {isDetailPage ? <DetailPage page={page} openProposal={openProposal} projects={projects} events={events} partners={partners} board={board} /> : <main>
        <section className="intro-section page-gutter" aria-labelledby="intro-title">
          <img className="intro-photo" src={siteUrl("/assets/community-group.png")} alt="Junge Menschen stehen gemeinsam auf einem Sportplatz" />
          <div className="intro-copy"><p className="eyebrow blue">AUS DER REGION. FÜR DIE MENSCHEN HIER.</p><h2 id="intro-title">Ideen, die <span>weiterkommen.</span></h2><p>Wir unterstützen ehrenamtliches Engagement, fördern junge Menschen und stärken den gesellschaftlichen Zusammenhalt – damit aus guten Ideen konkrete Möglichkeiten werden.</p>
            <div className="intro-links">
              <a href={siteUrl("/projekte/")}><span className="round-icon blue-icon"><UsersRound size={29} /></span><strong>Projekte</strong><small>Wir fördern Vorhaben, die Sport, Jugend und Gemeinschaft stärken.</small></a>
              <a href={siteUrl("/termine/")}><span className="round-icon green-icon"><CalendarDays size={28} /></span><strong>Termine</strong><small>Wir machen auf Veranstaltungen und Beteiligungsmöglichkeiten aufmerksam.</small></a>
              <a href={siteUrl("/partner/")}><span className="round-icon blue-icon"><Handshake size={29} /></span><strong>Partner</strong><small>Wir vernetzen Menschen und Organisationen, die etwas bewegen wollen.</small></a>
            </div>
          </div>
        </section>
        <section className="section association-section page-gutter"><div className="section-heading"><p className="eyebrow blue">WER WIR SIND</p><h2>Moinander bringt Menschen und Möglichkeiten zusammen.</h2></div><div className="home-association"><p className="lead">Wir sind ein neu gegründeter Förderverein. Wir vernetzen Menschen und unterstützen Ideen für Sport, Jugend und Gemeinschaft in unserer Region.</p><a className="text-link" href={siteUrl("/verein/")}>Mehr über den Verein <ArrowRight size={18} /></a></div></section>
        <section className="section project-section page-gutter" id="projekte"><div className="section-heading"><p className="eyebrow blue">WAS UNS BEWEGT</p><h2>Viele Ideen. Verschiedene Wege.</h2><p>Förderbedarf, Kooperation oder Einblick in eine Initiative: Hier entsteht Raum für die Projekte, an denen wir mitwirken oder über die wir informieren.</p></div>{getFeaturedProjects(projects).length ? <div className="project-list">{getFeaturedProjects(projects).map(({ id, slug, kind, title, description }, index) => <article className="project-row" key={id}><span className="project-number">0{index + 1}</span><div><span className="project-kind">{kind}</span><h3>{slug ? <a href={articleUrl(slug)}>{title}</a> : title}</h3><p>{description}</p></div></article>)}</div> : <div className="empty-state"><UsersRound size={36} /><h3>Die ersten Beiträge entstehen</h3><p>Wir stellen unsere Projekte und Einblicke hier vor, sobald sie veröffentlicht sind.</p></div>}<a className="text-link section-link" href={siteUrl("/projekte/")}>Alle Projekte & Einblicke <ArrowRight size={18} /></a></section>
        <section className="section twin-section page-gutter"><div className="twin-panel" id="termine"><span className="round-icon green-icon"><CalendarDays size={30} /></span><p className="eyebrow blue">TERMINE</p>{nextEvent ? <><time className="event-date" dateTime={nextEvent.startsAt}>{formatDate(nextEvent.startsAt)}</time><h2>{nextEvent.title}</h2><p>{nextEvent.summary}</p></> : <><h2>Wenn etwas ansteht, findest du es hier.</h2><p>Veranstaltungen und Aktionen kündigen wir an, sobald die Termine feststehen.</p></>}<a className="text-link" href={siteUrl("/termine/")}>Alle Termine <ArrowRight size={18} /></a></div><div className="twin-panel" id="partner"><span className="round-icon blue-icon"><HeartHandshake size={32} /></span><p className="eyebrow blue">PARTNER & SPONSOREN</p><h2>Gemeinsam mehr möglich machen.</h2><p>Wir freuen uns über Menschen, Vereine und Unternehmen, die unsere Ideen und Projekte unterstützen möchten.</p><a className="text-link" href={siteUrl("/partner/")}>Partner & Sponsoren <ArrowRight size={18} /></a></div></section>
        <section className="section participate-section page-gutter" id="mitmachen"><div><p className="eyebrow lime">MITMACHEN</p><h2>Dein Engagement zählt.</h2><p>Ob als ordentliches Mitglied mit eigenen Ideen oder als Fördermitglied: Moinander lebt von Menschen, die etwas bewegen wollen.</p></div><div className="participate-actions"><a className="button button-lime" href={siteUrl("/mitmachen/")}>Möglichkeiten entdecken <ArrowRight size={19} /></a><button className="button button-outline" type="button" onClick={openProposal}>Projekt vorschlagen <ArrowRight size={19} /></button></div></section>
        <section className="section home-contact-section page-gutter"><div><p className="eyebrow blue">KONTAKT</p><h2>Lass uns ins Gespräch kommen.</h2><p>Du hast eine Frage, eine Idee oder möchtest Moinander kennenlernen?</p></div><a className="button button-dark" href={siteUrl("/kontakt/")}>Nachricht schreiben <ArrowRight size={18} /></a></section>
      </main>}
      <footer className="site-footer page-gutter"><Logo /><p>Menschen verbinden. Projekte ermöglichen.</p><div className="footer-links"><a href={siteUrl("/")}>Startseite</a><a href={siteUrl("/verein/")}>Über uns</a><a href={siteUrl("/projekte/")}>Projekte</a><a href={siteUrl("/termine/")}>Termine</a><a href={siteUrl("/partner/")}>Partner</a><a href={siteUrl("/mitmachen/")}>Mitmachen</a><a href={siteUrl("/kontakt/")}>Kontakt</a></div><span>© 2026 Moinander e.V.</span></footer>
    </div>
    {floatingVisible && !proposalOpen && <>
      {floatingMenuOpen && <div className="floating-menu-backdrop" onClick={() => setFloatingMenuOpen(false)} aria-hidden="true" />}
      <button className="floating-menu-button" ref={floatingButtonRef} type="button" aria-label={floatingMenuOpen ? "Menü schließen" : "Menü öffnen"} aria-expanded={floatingMenuOpen} aria-controls="floating-navigation" onClick={() => setFloatingMenuOpen(!floatingMenuOpen)}>{floatingMenuOpen ? <X size={21} /> : <Menu size={21} />}<span>{floatingMenuOpen ? "Schließen" : "Menü"}</span></button>
      {floatingMenuOpen && <nav className="floating-menu-panel" id="floating-navigation" ref={floatingPanelRef} aria-label="Schwebende Navigation">{navigation.map(([label, href]) => <a key={label} href={siteUrl(href)} aria-current={href === (isDetailPage ? `/${page}/` : "/") ? "page" : undefined}>{label}<ArrowRight size={17} /></a>)}<button type="button" onClick={openProposal}>Projekt vorschlagen <ArrowRight size={17} /></button></nav>}
    </>}
    {backVisible && !menuOpen && !floatingMenuOpen && !proposalOpen && <button className="back-to-top" type="button" onClick={scrollToTop} aria-label="Nach oben scrollen" title="Nach oben">↑ <span>Nach oben</span></button>}
    {proposalOpen && <ProposalDialog close={closeProposal} />}
  </>;
}
