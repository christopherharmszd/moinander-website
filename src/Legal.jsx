const email = 'info@moinander.de';

function Address() {
  return <address>Moinander<br />Christopher Harms<br />Am Osterberg 7<br />21379 Echem</address>;
}

function Impressum() {
  return <>
    <section>
      <h2>Anbieter</h2>
      <Address />
      <p>Vertreten durch den Vorstand: Christopher Harms.</p>
      <p>Die Eintragung in das Vereinsregister steht noch aus. Registergericht und Vereinsregisternummer werden nach der Eintragung ergänzt.</p>
    </section>
    <section>
      <h2>Kontakt</h2>
      <p>E-Mail: <a href={`mailto:${email}`}>{email}</a><br />Kontaktformular: <a href="/kontakt/">moinander.de/kontakt/</a></p>
    </section>
    <section>
      <h2>Redaktionell verantwortlich</h2>
      <p>Christopher Harms, Am Osterberg 7, 21379 Echem.</p>
    </section>
  </>;
}

function Datenschutz() {
  return <>
    <section>
      <h2>Verantwortlich</h2>
      <Address />
      <p>Für Fragen zum Datenschutz und zur Ausübung deiner Rechte erreichst du uns unter <a href={`mailto:${email}`}>{email}</a>.</p>
    </section>
    <section>
      <h2>Aufruf der Website</h2>
      <p>Unsere öffentliche Website wird über GitHub Pages bereitgestellt. Beim Aufruf werden technisch notwendige Verbindungsdaten verarbeitet, etwa IP-Adresse, Zeitpunkt der Anfrage und aufgerufene Seite. GitHub gibt an, IP-Adressen beim Besuch einer Pages-Website zu Sicherheitszwecken zu protokollieren. Rechtsgrundlage für die Bereitstellung und Absicherung der Website ist Art. 6 Abs. 1 lit. f DSGVO. Unser berechtigtes Interesse ist ein sicherer und zuverlässiger Webauftritt. Weitere Informationen stehen in der <a href="https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages" target="_blank" rel="noopener noreferrer">GitHub-Pages-Dokumentation</a>.</p>
    </section>
    <section>
      <h2>Projekte, Bilder und Termine</h2>
      <p>Veröffentlichte Inhalte werden beim Aufruf direkt von Sanity geladen; Bilder können über dessen Bilddienst ausgeliefert werden. Dabei erhält Sanity technisch erforderliche Verbindungsdaten wie deine IP-Adresse und die angeforderten Inhalte. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO, unser Interesse an der Darstellung aktueller Vereinsinhalte. Informationen zur Verarbeitung durch Sanity findest du in dessen <a href="https://www.sanity.io/legal/privacy" target="_blank" rel="noopener noreferrer">Datenschutzhinweisen</a>.</p>
    </section>
    <section>
      <h2>Kontakt und Projektvorschläge</h2>
      <p>Wenn du uns über ein Formular schreibst, verarbeiten wir deinen Namen, deine E-Mail-Adresse und deine Nachricht. Bei einem Projektvorschlag kommen der Titel der Idee, die Beschreibung und gegebenenfalls der gewünschte Unterstützungsbedarf hinzu. Die Angaben werden erst beim Absenden an Web3Forms übermittelt und von dort an <a href={`mailto:${email}`}>{email}</a> weitergeleitet. Du kannst uns stattdessen direkt per E-Mail schreiben.</p>
      <p>Wir verwenden die Angaben ausschließlich zur Bearbeitung und Beantwortung deiner Anfrage. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO; wenn du eine Mitgliedschaft oder eine konkrete Zusammenarbeit anfragst, kann zusätzlich Art. 6 Abs. 1 lit. b DSGVO einschlägig sein. Die Pflichtfelder sind erforderlich, damit wir dir antworten können. Bei Web3Forms können Formulareinsendungen nach <a href="https://web3forms.com/" target="_blank" rel="noopener noreferrer">Anbieterangaben</a> abhängig von der Kontoeinstellung gespeichert werden; als Standard nennt der Anbieter bis zu drei Jahre. Unsere E-Mail-Kopien löschen wir, wenn die Bearbeitung abgeschlossen ist und keine gesetzlichen Aufbewahrungspflichten oder berechtigten Gründe für eine weitere Speicherung bestehen.</p>
    </section>
    <section>
      <h2>Cookies und ähnliche Technologien</h2>
      <p>Auf der öffentlichen Website setzen wir keine Analyse- oder Marketing-Cookies ein. Sie verwendet auch keinen eigenen lokalen Browserspeicher für Tracking oder Einstellungen. Deshalb erscheint dort kein Cookie-Banner. Externe Inhalte wie Instagram-Beiträge werden nur verlinkt und nicht eingebettet; erst ein Klick führt zur jeweiligen Plattform.</p>
      <p>Die gesonderte Redaktionsoberfläche verwendet nach der Anmeldung ein technisch notwendiges, geschütztes Sitzungscookie. Es läuft spätestens nach acht Stunden ab und ist für den Zugang zum geschützten Bereich erforderlich. Die Redaktion wird über einen Cloudflare Worker bereitgestellt; ihre veröffentlichten Inhalte liegen in Sanity. Auf der Redaktionsoberfläche werden zudem Schriften von Google Fonts geladen. Diese Hinweise sind für Personen relevant, die einen Redaktionszugang nutzen.</p>
    </section>
    <section>
      <h2>Dienstleister und Übermittlungen</h2>
      <p>Für Hosting, Inhalte, Redaktion und Formulare nutzen wir GitHub Pages, Sanity, Cloudflare und Web3Forms. Bei einzelnen Diensten kann eine Verarbeitung außerhalb der EU oder des EWR stattfinden, insbesondere in den USA. Weitere Angaben zu Empfängern, Speicherfristen und möglichen Schutzmaßnahmen erhältst du über die verlinkten Anbieterinformationen oder auf Anfrage bei uns.</p>
    </section>
    <section>
      <h2>Deine Rechte</h2>
      <p>Nach Maßgabe der DSGVO kannst du Auskunft über deine Daten, Berichtigung, Löschung oder Einschränkung der Verarbeitung verlangen. Du kannst der Verarbeitung widersprechen und, soweit die gesetzlichen Voraussetzungen vorliegen, Datenübertragbarkeit verlangen. Wende dich dafür an <a href={`mailto:${email}`}>{email}</a>. Du hast außerdem das Recht, dich bei einer Datenschutzaufsichtsbehörde zu beschweren, etwa beim <a href="https://www.lfd.niedersachsen.de/beschwerde" target="_blank" rel="noopener noreferrer">Landesbeauftragten für den Datenschutz Niedersachsen</a>.</p>
    </section>
    <p className="legal-updated">Stand: 30. September 2026</p>
  </>;
}

export function LegalPage({page}) {
  return <div className="legal-page page-gutter"><div className="legal-content">{page === 'impressum' ? <Impressum /> : <Datenschutz />}</div></div>;
}
