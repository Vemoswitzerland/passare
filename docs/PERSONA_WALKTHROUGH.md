# passare.ch — PERSONA-WALKTHROUGHS

> Stand: 24.04.2026 · Ziel: Jede Persona so durch die Plattform schicken wie sie es real tun würde, und jedes Detail finden, das sie entweder begeistert oder zurück zu companymarket.ch schickt.

**Grundsatz:** Ein Gap ist nicht nur „fehlendes Feature", sondern **jeder Moment, in dem der Nutzer denkt „das konnte companymarket aber besser"** — oder sich frustriert zurückzieht.

---

## 👤 PERSONA 1 — MARCO (reiner KÄUFER)

### Setup
Marco Rossi, 42, Lugano. Investor mit CHF 3–5 Mio. Eigenkapital. Sucht seit 18 Monaten eine Logistik- oder Produktionsfirma in der Deutsch- oder Süd-Schweiz. Hat Accounts bei companymarket.ch + 2 Konkurrenten. Bekommt 3× pro Woche E-Mails von Brokern. Spricht DE+IT, etwas FR. Geschäftlich sehr erfahren, technisch „mittel".

### Was er wirklich braucht
1. Schnell verstehen ob ein Inserat zu ihm passt — **ohne** für jedes NDA machen zu müssen
2. Mehrere Deals parallel managen
3. Beim Abendessen auf dem Handy noch schnell was checken
4. Beweisen können dass er ein seriöser Käufer ist (damit Verkäufer schneller das NDA freigeben)
5. Nie wieder einen Deal verpassen weil er zu spät eine Alert-Mail gelesen hat

### Journey + Gaps

#### 1. Landing (`/`, `/kaufen`)
- ✅ Value Prop klar (0% Provision, MAX-Abo)
- 🔴 **FEHLT:** Social Proof — Live-Zahlen („Aktuell 847 Inserate · 123 MAX-Käufer · CHF 2.3 Mrd. Transaktionsvolumen"). Marco glaubt dir ohne Zahlen nicht.
- 🔴 **FEHLT:** Testimonials mit Namen + Foto + Deal-Volumen (companymarket hat Carla Kaufmann als Gesicht — wer ist bei uns?)
- 🟡 **FEHLT:** 60-Sekunden Explainer-Video „So funktioniert passare"

#### 2. Registrierung
- ✅ hCaptcha, AGB-Accept, SSO geplant
- 🔴 **FEHLT:** **LinkedIn-SSO explizit** (für Investor-Trust: companymarket hat nur E-Mail → Marco nutzt dort Fake-Accounts)
- 🟡 **FEHLT:** Während Registrierung: „Was bringt dir KYC? → Schneller NDA-Zugang, Verified-Badge"

#### 3. Onboarding
- ✅ 3-Step Wizard
- 🔴 **FEHLT:** **Konversations-Onboarding statt Wizard.** Chat-Style: „Wonach suchst du heute?" → Marco antwortet in Freitext → Claude baut Suchprofil automatisch. Wizard fühlt sich wie Behörde an.
- 🔴 **FEHLT:** **Import aus companymarket:** „Lade deine Favoriten-CSV hoch, wir finden die Inserate bei uns." Massiver Switching-Enabler.
- 🟡 **FEHLT:** Budget-Slider statt Freitext (UX)

#### 4. Dashboard-Home
- ✅ Match-Score, Stats
- 🔴 **FEHLT:** **Daily Digest:** 3 kuratierte Top-Matches jeden Morgen um 7:00 („Heute für dich: 3 neue passende Inserate")
- 🔴 **FEHLT:** **Deal-Pipeline-Kanban** (Neu → Kontaktiert → NDA → DD → LOI → Closed/Verloren). Favoriten + Stages kombiniert (Etappe 57 hat das angedeutet, aber als Kanban-View muss es explizit sein)
- 🟡 **FEHLT:** Aktivitäts-Recap („Diese Woche: 12 Views, 2 Anfragen, 1 NDA")

#### 5. Marktplatz `/entdecken`
- ✅ Filter, Bucket-Suche
- 🔴 **FEHLT:** **Kartenansicht** neben Listenansicht. Marco denkt regional („Was gibts grad in Tessin?")
- 🔴 **FEHLT:** **AI-Chat-Suche:** „Zeig mir Logistik-Firmen im Tessin mit >20% EBITDA-Marge und Umsatz zwischen 2 und 5 Mio" — besser als 15 Dropdowns
- 🔴 **FEHLT:** **„Hidden Gems"-Sektion** (Inserate mit wenig Views aber hohem Match-Score für dich)
- 🟡 **FEHLT:** Sortierung nach Match-Score (Default für eingeloggte)
- 🟡 **FEHLT:** Anzahl Interessenten transparent pro Inserat („23 Views, 7 NDAs") — Dringlichkeit

#### 6. Inserat-Detail
- ✅ Anonymer Teaser, Finanzdaten
- 🔴 **FEHLT:** **„Warum das zu dir passt"-Box** (Claude erklärt: „Passt zu deinem Profil wegen Branche, Region, Budget")
- 🔴 **FEHLT:** **Öffentliche Q&A** — Käufer stellt anonym Fragen, Verkäufer antwortet, ALLE sehen es. (Airbnb-Model). Massiv besser als isolierte Nachrichten.
- 🔴 **FEHLT:** **Benchmark-Box:** „Ähnliche Druckereien wurden in den letzten 12 Monaten zu 4–6× EBITDA verkauft. Aktueller Preis: 5.2× — fair." (aus KMU-Multiples-DB)
- 🔴 **FEHLT:** **Timer „Noch X Tage aktiv"** — Dringlichkeit
- 🟡 **FEHLT:** **In-Line Finanzierungsrechner** (nicht als separate Seite, sondern embedded)
- 🟡 **FEHLT:** „Speichern für später" mit Reminder-Datum

#### 7. Anfrage + NDA
- ✅ In-App Messaging, eSign
- 🔴 **FEHLT:** **Anfrage-Template-Picker:** 3 vorgefertigte Nachrichten („Vorstellung + Budget + Timing") die Marco anpassen kann — sonst schreibt er 15× dieselbe Mail
- 🔴 **FEHLT:** **Käufer-Profil-Preview** — wenn Marco Anfrage schickt, sieht Verkäufer automatisch sein Käufer-Profil (verifiziert, Budget-Range, Erfahrung)
- 🔴 **FEHLT:** **Finanzierungsnachweis-Upload als Trust-Signal** beim NDA (Etappe 120 zu spät! Muss Teil der Anfrage-Flow sein)

#### 8. Datenraum
- ✅ Access-Control, Watermark, Audit-Trail
- 🔴 **FEHLT:** **Berater-Share** — Marco gibt seinem Steuerberater zeitlich begrenzten Read-Only-Zugang (max 14 Tage). KILLER-Feature gegenüber companymarket.
- 🔴 **FEHLT:** **Download-all-as-ZIP** mit einem Klick
- 🔴 **FEHLT:** **Annotations / Kommentare** in PDFs (Yellow-Highlighter-Style)
- 🔴 **FEHLT:** **Q&A direkt an Datei geknüpft** („Frage zu Bilanz.pdf Seite 12")
- 🟡 **FEHLT:** **Due-Diligence-Report-Generator** — alle Notizen + Highlights als PDF exportierbar für Marcos Team

#### 9. Kommunikation nach NDA
- ✅ Thread-View, Realtime
- 🔴 **FEHLT:** **Meeting-Scheduler** direkt im Thread (Calendly-like, Etappe 136 zu weit hinten)
- 🔴 **FEHLT:** **Video-Call im Browser** (oder zumindest Jitsi/Whereby-Embed, Etappe 137)
- 🔴 **FEHLT:** **Shared Milestones** (NDA ✓ → DD gestartet → LOI erhalten → Signing) — beide Seiten synchron

#### 10. LOI + Closing
- ✅ LOI-Generator, Skribble
- 🔴 **FEHLT:** **Anwalts-Marketplace** — passare hat 5–10 CH-Anwälte zertifiziert, Marco bucht direkt (passare verdient 20% Vermittlung — legit Revenue ohne Deal-Provision)
- 🟡 **FEHLT:** **Escrow-Partner** (Bank-Partnerschaft für Anzahlungs-Treuhand)

#### 11. Mobile
- 🔴 **FEHLT:** **PWA (Progressive Web App)** — Push-Notifications, Offline-Lesen, Home-Screen-Install
- 🔴 **FEHLT:** **Mobile-First für kritische Flows:** Alert empfangen → Inserat anschauen → Anfrage schicken in <90 Sekunden auf Handy

#### 12. MAX-Abo-Wert
- ✅ 7 Tage Frühzugang, alle Filter, WhatsApp-Alerts
- 🔴 **FEHLT:** **Quartals-Branchenreport** als PDF (exklusiv für MAX)
- 🔴 **FEHLT:** **„Persönlicher Ansprechpartner"** ist zu vage — wer konkret? Erreichbar wie? Antwortzeit? Slack-Channel für MAX-Community?
- 🔴 **FEHLT:** **Anonymisierte Käufer-Peers** — Marco sieht (anonym) was ähnliche Investoren machen („Andere Käufer mit deinem Profil haben diese Woche 3 Logistik-Deals angefragt")

### Marcos Deal-Breaker (würde ihn zu companymarket zurückbringen)
1. Kein LinkedIn-SSO (Misstrauen bei Plattform)
2. Keine Mobile-PWA (er ist 60% auf Handy)
3. Kein Berater-Datenraum-Zugang (kann nicht mit Steuerberater arbeiten)
4. Fehlendes Daily-Digest mit Top-Matches (er will nicht 10× pro Tag checken)
5. Kein Meeting-Scheduler (Zurück-zu-Outlook-Friction)

---

## 👤 PERSONA 2 — ANNA (VERKÄUFERIN)

### Setup
Anna Müller, 58, Zürich. Inhaberin einer Offset-Druckerei (20 MA, CHF 4 Mio. Umsatz, CHF 600k EBITDA). Mann vor 2 Jahren verstorben. Keine Nachfolger in der Familie. Bisher 6 Monate bei companymarket — 40 Anfragen, 3 ernsthafte Gespräche, 0 Abschluss. Technisch „okay" (nutzt WhatsApp, Outlook, Bexio). Extrem sensibel bezüglich Vertraulichkeit — ihre 20 MA dürfen nichts erfahren.

### Was sie wirklich braucht
1. Garantie dass ihre MA und Kunden nichts erfahren
2. Klarheit was alles kostet (Grundpaket + mögliche Extras)
3. Nur ernsthafte Käufer (keine Broker-Spam, keine Zeit-Verschwender)
4. Jemand der hilft wenn sie nicht weiterweiss
5. Die Sicherheit dass sie die Kontrolle behält

### Journey + Gaps

#### 1. Landing (`/verkaufen`)
- ✅ Dashboard-Mockup
- 🔴 **FEHLT:** **Anonyme Case Studies** — „Druckerei im Raum Zürich, CHF 4M Umsatz, verkauft in 5 Monaten an strategischen Käufer". Anna muss sich wiedererkennen.
- 🔴 **FEHLT:** **„Wie anonym bleibe ich wirklich?"-Sektion** — nicht nur Versprechen, sondern konkretes Wie (Titel-Check, Bild-EXIF-Strip, NDA-Gate)
- 🟡 **FEHLT:** **Total-Cost-Rechner** („Was kostet Inserat + durchschnittliche Verlängerung + Foto-Session?")

#### 2. Pre-Registrierung
- 🔴 **FEHLT:** **„Ist mein Unternehmen verkäuflich?"-Check** (5 Fragen → EBITDA?, Umsatz-Stabilität?, Kundenkonzentration? → Ergebnis „Ja, eher ja, schwierig")
- 🔴 **FEHLT:** **Anonyme Schnell-Bewertung BEVOR Account** (Anna gibt Branche+Umsatz+EBITDA, kriegt Range — Lead-Magnet)
- 🟡 **FEHLT:** **Chatbot vor Login** (Basis-Fragen wie „Wie lange dauert das? Was kostet es?")

#### 3. Onboarding
- ✅ Rolle-Wizard, AGB
- 🔴 **FEHLT:** **„Wie ernst ist dein Verkaufswunsch?"-Frage** (für Matching-Qualität + interne Lead-Scoring)
- 🔴 **FEHLT:** **Timing-Erwartung setzen** (3M/6M/12M/offen) — rechtfertigt später das Paket
- 🟡 **FEHLT:** **Telefon-Verifikation jetzt**, nicht Etappe 111 als Afterthought

#### 4. Inserat-Wizard Step 1: Grunddaten
- ✅ Zefix-Integration
- 🔴 **FEHLT:** **Live-Anonymitäts-Coach** — während Anna „Druckerei Müller Zürich" tippt, erscheint rot: „Dein Titel verrät deinen Namen!" Mit Verbesserungs-Vorschlag.
- 🔴 **FEHLT:** **Titel-Vorschläge** (3 generierte Optionen für Anna auswählbar)
- 🔴 **FEHLT:** **Branchen-spezifische Hinweise** („In Druckerei-Branche erwarten Käufer: Auftragsbuchvolumen, Kundenstruktur, Maschinenalter")

#### 5. Step 2: Finanzen
- 🔴 **FEHLT:** **Import aus Buchhaltung** (Bexio, Abacus, Sage, Run My Accounts) — ein Klick, Daten drin. Massiver Unterschied zu companymarket.
- 🔴 **FEHLT:** **PDF-Upload → Auto-Extraction** (Bilanz hochladen → OCR + LLM → Felder auto-gefüllt, Anna kontrolliert)
- 🔴 **FEHLT:** **Treuhänder-Freigabe-Flow** — Anna lädt Treuhänder ein, der bestätigt die Zahlen per Link → „Verifiziert durch Treuhänder"-Badge
- 🔴 **FEHLT:** **Peer-Comparison live** („Druckereien deiner Grösse: 15% EBITDA-Marge im Schnitt — deine 18% ist top!")

#### 6. Step 3: Teaser + KI
- ✅ AI-Teaser
- 🔴 **FEHLT:** **Teaser in 4 Sprachen auto** — Anna schreibt DE, System generiert FR/IT/EN (für Premium)
- 🔴 **FEHLT:** **Teaser-A/B-Test eingebaut** — 2 Versionen live, System zeigt nach 50 Views welche besser performt
- 🟡 **FEHLT:** **„Lies laut vor"-Funktion** — manche Menschen hören Fehler die sie nicht sehen

#### 7. Step 4: Bilder + Paket
- 🔴 **FEHLT:** **EXIF-Warnung mit Blur-Preview** („Dein Bild enthält GPS der Firmenadresse. Soll ich das entfernen?")
- 🔴 **FEHLT:** **Anonymous-Staging-Empfehlungen** (automatische Blur-Vorschläge für Logos in Bildern)
- 🔴 **FEHLT:** **Neutrale Branchen-Stockfotos als Alternative** (passare-Library, wenn eigene Fotos zu identifizierend)
- 🔴 **FEHLT:** **ROI-Schätzung pro Paket** („Pro-Pakete bekommen 3× mehr Anfragen als Light — bei CHF 600 mehr Investition gerechtfertigt?")

#### 8. Nach Publish
- ✅ Bestätigung, Rechnung
- 🔴 **FEHLT:** **Launch-Boost automatisch** — erste 7 Tage Top-Platzierung (kleines Geschenk, Conversion-Treiber)
- 🔴 **FEHLT:** **Published-Announcement-Generator** — anonymer LinkedIn-Post-Text („Ich stehe vor spannenden Veränderungen...") mit passare-Logo + Link
- 🟡 **FEHLT:** **E-Mail „Dein Inserat ist live" mit Social-Share-Buttons**

#### 9. Laufendes Inserat
- ✅ Stats, Anfragen
- 🔴 **FEHLT:** **Wöchentlicher Report jeden Montag** (E-Mail mit Views/Anfragen/Ranking) — Anna muss nicht daran denken einzuloggen
- 🔴 **FEHLT:** **Optimization-Coach** — „Dein Inserat hat 50% weniger Views als vergleichbare. 3 Tipps: …" (automatisch nach 14 Tagen)
- 🔴 **FEHLT:** **Auto-Alert bei Stats-Rückgang** — wenn Views > 30% drop → „Willst du einen Boost?"

#### 10. Anfrage-Management
- 🔴 **FEHLT:** **Anfrage-Scoring** — jede Anfrage bekommt 0–100 Score (KYC? Finanzierung nachgewiesen? Branchen-Erfahrung? Budget-Match?). Anna sieht nur Top-Anfragen.
- 🔴 **FEHLT:** **Schnellantwort-Templates** — Anna kann eigene Antwort-Bausteine speichern („Danke für Ihr Interesse. Bevor ich weiterkommuniziere…")
- 🔴 **FEHLT:** **Im-Urlaub-Modus** — 2 Wochen Auto-Reply, pausiert E-Mail-Alerts, Status auf Profil „Antwortet wieder ab 15.5."
- 🟡 **FEHLT:** **Gruppen-NDA-Modus** — alle Interessenten derselben Runde bekommen gleichzeitig NDA-Link (schneller)

#### 11. Datenraum-Verwaltung
- ✅ Upload, Watermark
- 🔴 **FEHLT:** **Bulk-Upload + Drag&Drop** (20 PDFs auf einmal, nicht einzeln)
- 🔴 **FEHLT:** **Ordner-Vorlagen nach Branche** („Druckerei-DD-Set": vorgefertigte Struktur mit 15 Standard-Ordnern)
- 🔴 **FEHLT:** **„Wer hat was angeschaut"-Dashboard** (einfache Übersicht: „Marco R. hat Bilanz_2024.pdf 3× angeschaut")
- 🔴 **FEHLT:** **Panic-Button „Revoke all access"** — falls Leak-Verdacht mit einem Klick alle Zugänge entziehen

#### 12. Beratung + Support
- 🔴 **FEHLT:** **Expert-Marketplace in-App** — Anna bucht passare-zertifizierten M&A-Berater direkt über Plattform (passare verdient 20% Vermittlung). KILLER-Revenue-Stream ohne Deal-Provision!
- 🔴 **FEHLT:** **1:1 Video-Beratung für Premium-Pakete** (z.B. 60 Min inkludiert, ausbaubar)
- 🟡 **FEHLT:** **Peer-Community für Verkäufer** — private Gruppe mit anderen die gerade verkaufen (Austausch, ohne dass sie sich gegenseitig identifizieren)

#### 13. Nach dem Verkauf
- 🔴 **FEHLT:** **Sold-Mark mit finalem Preis (anonym)** — füttert Benchmarking-DB für zukünftige Verkäufer
- 🔴 **FEHLT:** **Testimonial-Kampagne** — wenn happy → „Darfst du als Fallstudie erscheinen?"
- 🔴 **FEHLT:** **Referral-Incentive** — Anna empfiehlt andere Verkäufer → sie bekommt CHF 100 Gutschrift für Beratungsleistungen

#### 14. Wenn es NICHT klappt
- 🔴 **FEHLT:** **Exit-Survey** nach 6M ohne Abschluss — Warum? Was fehlte?
- 🔴 **FEHLT:** **Alternative-Pfade** — „Verkauf schwierig? Vielleicht: Fusion-Finder, Teilverkauf, Teilhaber, Liquidation-Partner"
- 🔴 **FEHLT:** **Automatisches Re-Listing-Angebot** bei Ablauf mit Rabatt-Gutschein

### Annas Deal-Breaker
1. Unklare Kosten-Transparenz → sie kauft nie
2. Kein Import aus Bexio → 2 Stunden manuelle Dateneingabe = Abbruch
3. Kein Anonymitäts-Coach → sie traut sich nicht zu publizieren
4. Keine Unterstützung bei schwierigen Fragen → sie geht zu companymarket weil dort Carla Kaufmann persönlich antwortet

---

## 👤 PERSONA 3 — LUKAS (ADMIN)

### Setup
Lukas Weber, 32, Zürich. Head of Operations bei passare. Vorher 4 Jahre bei Ricardo.ch als Marketplace-Manager. Loggt sich 8:00 ein, Moderations-Queue bis 9:00, Support bis 10:00, Management-Meeting 10:00, Nachmittags Content + Features. Er ist das Gesicht der Plattform für alle Beschwerden.

### Was er wirklich braucht
1. Morgens in 30 Min sehen was gestern passiert ist + was heute dringend ist
2. Moderation in Sekunden (nicht Minuten) pro Inserat
3. Fraud-Fälle vorher erkennen, nicht reagieren
4. Zahlen fürs Management-Meeting in 2 Klicks, nicht 2 Stunden Excel
5. Bei Support-Tickets immer wissen wer der User ist + seine Historie

### Journey + Gaps

#### 1. Morgens — Login + Command Center
- ✅ MFA
- 🔴 **FEHLT:** **Command-Center-Home** — 1 Screen: „Heute: 12 Moderationen, 3 kritische Tickets, 2 Refund-Anfragen, 1 Fraud-Flag"
- 🔴 **FEHLT:** **Yesterday's Digest** (E-Mail um 7:00): „Gestern: 42 Signups (davon 12 Verkäufer, 30 Käufer), 3 neue Inserate published, CHF 2'670 Revenue, 0 Incidents"
- 🔴 **FEHLT:** **KPI-Delta-Alerts** — wenn Signups > 20% unter Vorwoche → Alert

#### 2. Moderations-Queue
- ✅ Anonymitäts-Audit
- 🔴 **FEHLT:** **Side-by-Side-View** — links was der Käufer sehen wird, rechts Admin-Detail (interne Notes, User-Historie, Finanzdaten unmaskiert)
- 🔴 **FEHLT:** **AI-Pre-Check-Score** („Claude: 95% sicher, 2 Bedenken: Firmenname in Bild-Dateinamen erkannt")
- 🔴 **FEHLT:** **One-Click-Reject mit Reason-Template** — dropdown „Firmenname im Teaser" → automatische E-Mail an Verkäufer mit Verbesserungsvorschlag
- 🔴 **FEHLT:** **Verkäufer-Historie sichtbar** („Schon 3 Inserate, alle sauber publiziert, 0 Beschwerden — kann Auto-Publish?")
- 🔴 **FEHLT:** **Bulk-Approval** für Trust-Tier-Verkäufer (Auto-Publish mit Post-Hoc-Review)

#### 3. User-Management
- ✅ Impersonation, 4-Eyes, Tags, Notes
- 🔴 **FEHLT:** **Fraud-Detection-Dashboard** — automatische Flags: 5+ Accounts gleiche IP, Stripe-Decline-Pattern, verdächtige Nachrichten (LLM-Analyse), VPN-Detection
- 🔴 **FEHLT:** **Risk-Score pro User (0–100)** mit Breakdown (Account-Alter, Verifikation, Zahlungshistorie, Moderations-Flags)
- 🔴 **FEHLT:** **Bulk-Operations** (alle inaktiven seit 6M → Reminder, alle MAX-Abgelaufenen → Winback)
- 🔴 **FEHLT:** **DSGVO-Request-Self-Service** — Admin klickt Button → alle User-Daten als JSON-ZIP
- 🟡 **FEHLT:** **User-Timeline** (alle Events chronologisch: Signup → Inserat → NDA → Zahlung → Support-Ticket)

#### 4. Finanzen
- ✅ Payment-Overview, MwSt
- 🔴 **FEHLT:** **Monatsabschluss-Export** (CSV/DATEV/Abacus/Bexio-Format) — für Treuhänder
- 🔴 **FEHLT:** **MwSt-Quartalsabrechnung** auto-generiert (CH-Form 103)
- 🔴 **FEHLT:** **Revenue-Recognition** — bei 6M-Paket automatisch monatliche Revenue-Buchung (nicht alles am Zahlungstag)
- 🔴 **FEHLT:** **Dunning-Dashboard** — Failed-Payments mit Self-Service-Aktion „Erinnerung senden", „Auf Pause", „Kulanz-Verlängerung"
- 🟡 **FEHLT:** **Stripe-Dispute-Tracker** (Chargebacks) mit Response-Deadline

#### 5. Support-Tickets
- ✅ Ticket-System
- 🔴 **FEHLT:** **Live-Chat-Option** (wenn User online, sonst Ticket)
- 🔴 **FEHLT:** **Canned-Responses-Library** (Shortcuts: /refund, /pause, /verify)
- 🔴 **FEHLT:** **Sentiment-Analyse auf Tickets** (rot/gelb/grün, Lukas sieht sofort Eskalations-Risiko)
- 🔴 **FEHLT:** **SLA-Timer** pro Ticket mit Eskalation (> 4h unbeantwortet → rot)
- 🔴 **FEHLT:** **User-Context in Ticket-View** — alle Zahlungen, Inserate, Nachrichten dieses Users sichtbar (kein App-Switching)
- 🟡 **FEHLT:** **Ticket→Knowledge-Base-Artikel** One-Click (häufige Frage → FAQ-Artikel)

#### 6. Content-Management
- 🔴 **FEHLT:** **4-Sprachen Split-View Editor** (Blog-Artikel in DE/FR/IT/EN parallel editieren)
- 🔴 **FEHLT:** **SEO-Score pro Artikel** (Yoast-like: Keywords, Meta, Readability)
- 🔴 **FEHLT:** **Content-Calendar** (Redaktionsplan, wer schreibt was wann)
- 🔴 **FEHLT:** **Translation-Memory** — Lukas übersetzt nicht jedes Mal neu, System erinnert sich

#### 7. Analytics + Reports
- ✅ MRR, GMV, Churn in Plan
- 🔴 **FEHLT:** **Funnel-Analyse visuell** (Signup → Onboarding → Inserat → Zahlung → Published — wo droppen Leute ab?)
- 🔴 **FEHLT:** **Search-Analytics** (welche Suchen liefern 0 Ergebnisse → Content-Gaps)
- 🔴 **FEHLT:** **Session-Replay** (Hotjar/FullStory) für Bug-Reproduktion
- 🔴 **FEHLT:** **Slack-/E-Mail-Alerts bei KPI-Abweichungen** (nicht passive Dashboards)
- 🟡 **FEHLT:** **Exportierbare Management-Reports** (monatlich automatisch als PDF)

#### 8. Feature-Flags + Experimente
- ✅ Feature-Flags
- 🔴 **FEHLT:** **Experiment-Lifecycle** (Hypothesis → Running → Concluded → Archive mit Learnings)
- 🔴 **FEHLT:** **Statistical-Significance-Calculator** eingebaut (zeigt „noch nicht signifikant" vs „klarer Winner")
- 🔴 **FEHLT:** **Auto-Rollback** wenn Conversion crashed > 20%

#### 9. Newsletter-Versand
- ✅ Newsletter-Engine, Segmentierung
- 🔴 **FEHLT:** **Segment-Builder drag&drop** (nicht SQL)
- 🔴 **FEHLT:** **Spam-Score-Check** vor Versand (Mail-Tester-API)
- 🔴 **FEHLT:** **Deliverability-Dashboard** (Open/Click/Bounce/Complaint-Rate pro Domain)
- 🔴 **FEHLT:** **Preview in 6 Mail-Clients** (Gmail, Outlook, iPhone, Android…)

#### 10. Partner-Management
- 🔴 **FEHLT:** **Partner-Portal** (eigene Logins für Banken, Berater, Broker — mit Revenue-Share-Dashboard)
- 🔴 **FEHLT:** **Anwalts-Marketplace-Admin** (Zertifizierung, Bewertung, Revenue-Split)
- 🟡 **FEHLT:** **White-Label-Config** (wenn ein Kanton-Verband passare als eigenes Portal nutzt)

#### 11. System-Health
- ✅ Login-Attempts, Sentry
- 🔴 **FEHLT:** **Öffentliche Status-Page** (status.passare.ch) — Trust-Signal + reduziert Support-Tickets bei Incidents
- 🔴 **FEHLT:** **Cost-Monitoring** (Stripe-Fees, Supabase, Resend, Claude API) — Alert wenn Kosten-Anomalie
- 🔴 **FEHLT:** **Performance-Budgets** (wenn /entdecken > 800ms Median → Alert)

#### 12. Compliance-Ops
- 🔴 **FEHLT:** **DSGVO-Requests-Board** (eingehend → in Bearbeitung → fertig, mit 30-Tage-Timer)
- 🔴 **FEHLT:** **Data-Retention-Automation** (alte Daten auto-anonymisieren nach X Jahren)
- 🔴 **FEHLT:** **Audit-Report-Generator** (für externe Prüfer: alle Admin-Actions der letzten 12M als PDF)

#### 13. Team-Tools
- 🔴 **FEHLT:** **Admin-Rollen-Differenzierung** — nicht nur „admin", sondern: `super_admin`, `moderator`, `support`, `finance`, `content_editor`. Tickets + Inserate-Moderation ist nicht dieselbe Person die Refunds macht.
- 🔴 **FEHLT:** **Internal-Admin-Chat** oder Slack-Integration (Notify Admin-Channel bei Fraud-Flag)
- 🟡 **FEHLT:** **Shift-Scheduling** (später wenn Team grösser)

#### 14. Growth-Experimente
- 🔴 **FEHLT:** **Landing-Page-Builder** (Marketing kann ohne Dev neue Varianten, Unbounce-like)
- 🔴 **FEHLT:** **Ref-Code-Manager** (Influencer-Codes, Partner-Codes mit Revenue-Share)
- 🔴 **FEHLT:** **UTM-Generator + Campaign-Tracker** (wieviel Traffic brachte welche Kampagne?)

### Lukas' Deal-Breaker
1. Moderations-Queue ohne AI-Pre-Check → er ist 3h/Tag gebunden statt 30 Min
2. Keine Fraud-Detection → erste Scams zerstören Trust der ganzen Plattform
3. Reports nur in Plausible → Management-Meetings sind chaotisch
4. Eine einzige „admin"-Rolle → Finance-Daten für Support-Mitarbeiter sichtbar (DSGVO-Risiko!)
5. Keine Status-Page → bei Incident explodieren Support-Tickets

---

## 👤 PERSONA 4 — HANS (NACHFOLGER-SUCHENDER INHABER) — NEU aus Sprachmemo

### Setup
Hans Furrer, 64, Olten. Inhaber Malerbetrieb (12 MA, ~1.8 Mio Umsatz, gesund). Seit 40 Jahren im Geschäft. **Sucht keinen Cash-Out — sucht Nachfolger.** Hat genug Geld, will Lebenswerk weiterführen lassen. Seine Mitarbeiter sind ihm wichtig. Zwei eigene Kinder im Bürojob, kein Interesse am Betrieb. Spricht nur Deutsch. Nutzt WhatsApp, hat Mühe mit komplizierten Web-Tools.

### Was er wirklich braucht
1. Einen Weg, **passende Nachfolger zu finden** — nicht beliebige Käufer
2. Sehen können wer der Mensch hinter der Anfrage ist (CV, Werdegang, Motivation), bevor er weitergibt
3. Nicht das Gefühl haben "ich werde verkauft" — eher "ich gebe weiter"
4. Anonymität bis er selber bereit ist (Mitarbeiter sollen es nicht aus dem Internet erfahren)
5. Möglichst keine Anwälte/Berater anfangs (kommt für ihn später)

### Journey + Gaps
- 🔴 **FEHLT komplett:** Kategorie "Nachfolge gesucht" als alternativer Inserat-Typ. Heute kann er nur "Firma verkaufen" — fühlt sich falsch an.
- 🔴 **FEHLT:** Filter im Marktplatz "Nachfolger gesucht" vs "Firma zu verkaufen"
- 🔴 **FEHLT:** Bidirektionale Suche — er möchte aktiv Talent-Profile durchsuchen ("Maler-Meister in BE/SO mit 5+ Jahren Erfahrung")
- 🔴 **FEHLT:** Eigenes Pricing-Paket "Nachfolge-Light" (~CHF 90?) weil er keinen unmittelbaren Cash-Outflow hat
- ✅ Anonyme Inserat-Detail-Page existiert bereits (anonyme Eckdaten + Volltext nach Anfrage)

### Was Hans bei companymarket verloren ist
Companymarket hat keine Nachfolge-Kategorie. Hans hat dort ein "zu verkaufen"-Inserat geschaltet, bekommt nur Investor-Anfragen die ihn enttäuschen ("die wollen den Betrieb zerlegen"). Frustriert.

→ Adressiert durch **Phase 2 P2.1 Nachfolger-Marktplatz**.

---

## 👤 PERSONA 5 — MARC (TALENT MIT ÜBERNAHME-WUNSCH) — NEU aus Sprachmemo

### Setup
Marc Hofer, 38, Bern. Malermeister mit eigener Prüfung, seit 8 Jahren Foreman in einem grösseren Maler-Betrieb (60 MA). Geheimer Wunsch: eigener Betrieb. Hat CHF 200k auf der Seite + Eltern könnten weitere 300k beisteuern. Will nicht von Null gründen — möchte einen bestehenden Betrieb mit Kundenstamm übernehmen. **Darf bei seinem aktuellen Arbeitgeber nicht auffallen** dass er sucht.

### Was er wirklich braucht
1. Anonyme Sichtbarkeit — auf der Plattform präsent sein, ohne dass sein Name oder seine LinkedIn-URL preisgegeben werden
2. Affordable — er ist kein MAX-Käufer. CHF 199/Monat ist zu viel.
3. Verkäufer wie Hans sollen ihn FINDEN können (passive Suche)
4. Erkennen können was eine Übernahme finanziell bedeutet (Finanzierung, Werte)
5. Know-How-Hilfe: was muss er beim Übernahme-Prozess beachten?

### Journey + Gaps
- 🔴 **FEHLT komplett:** Käufer-Talent-Tier (CHF 24/Jahr) — heute hat er nur Wahl Basic (kann nichts) oder MAX (zu teuer)
- 🔴 **FEHLT:** Anonymes öffentliches Talent-Profil ("Maler-Meister, BE, sucht Übernahme 1-3 Mio")
- 🔴 **FEHLT:** Onboarding-Quiz das aus seinen Antworten ein Profil baut
- 🔴 **FEHLT:** "Privatsphäre-Garantie" — sichtbar dokumentiert dass Verkäufer nur Profil-Eckdaten sehen, kein Klarname bis zur Anfrage
- 🔴 **FEHLT:** Ratgeber-Hub für "Wie übernehme ich einen Betrieb?" (Etappe `/ratgeber` existiert, aber Übernahme-Inhalte fehlen)

### Was Marc heute macht
Heute liest er passiv companymarket-Inserate, schickt nie Anfragen weil er Angst hat dass sein Arbeitgeber es mitkriegt. Bewegt sich nicht von der Stelle.

→ Adressiert durch **Phase 2 P2.1 Nachfolger-Marktplatz + P2.2 Talent-Tier**.

---

## 👤 PERSONA 6 — LENA (FRUSTRIERTE MITARBEITERIN, EINE VON 500'000) — NEU aus Sprachmemo

### Setup
Lena Bühler, 52, Aarau. HR-Leiterin in einer Mittelfirma (180 MA). Seit 22 Jahren angestellt. Verdient anständig, aber: spürt seit 5 Jahren "ich bin im falschen Setting, ich wäre eine bessere Chefin". Hat keinen konkreten Übernahme-Plan, aber Lust würde sie haben. Cyrils 500'000-Schweizer-Persona: "Eigentlich bin ich der/die geborene Chef/Chefin."

### Was sie wirklich braucht
1. Ein Ort wo sie sich präsentieren kann ohne dass es viel kostet — CHF 24/Jahr ist OK
2. Sichtbarkeit für mögliche Verkäufer ("ich bin offen für Gespräche, hier ist mein Profil")
3. Newsletter / News über M&A-Markt CH — sie ist neugierig, nicht aktiv
4. Niedrige Schwelle — kein Mandat, kein Anwalt, einfach "drin sein"
5. Nicht das Gefühl, einen aggressiven Sales-Funnel runterzulaufen

### Journey + Gaps
- 🔴 **FEHLT:** Talent-Tier (siehe Marc)
- 🔴 **FEHLT:** Newsroom in dem sie passiv Beiträge konsumieren kann (Branchenleader-Content-Hub)
- 🔴 **FEHLT:** Niedrigschwellige "ich bin grundsätzlich interessiert"-Eintragung (Quiz, kein klassisches Profil-Formular)
- 🔴 **FEHLT:** Kuratierte Inhalte für "ich überlege mal eine Übernahme — wie geht das?"
- 🔴 **FEHLT:** Möglichkeit selber im Newsroom kleine Posts zu schreiben ("HR-Erfahrung sucht Firma im Mittelstand")

### Was Lena heute macht
Nichts. Sie liest gelegentlich Handelszeitung, denkt sich "schade dass es keinen einfachen Marktplatz gibt", schliesst den Tab. Wird nie konvertieren ohne niedrigschwelliges Angebot.

→ Adressiert durch **Phase 2 P2.2 Talent-Tier + P2.4 Branchenleader-Content-Hub**.

---

## 🎯 KONSOLIDIERTE TOP-20 MUST-FIX (pre-Launch)

Aus allen 3 Perspektiven zusammen — was KRITISCH für den Launch ist, wenn passare companymarket verdrängen soll:

### Für Marco (Käufer)
1. **Daily-Digest** mit 3 Top-Matches morgens um 7:00
2. **Deal-Pipeline-Kanban** im Dashboard (Favoriten + Stages)
3. **Öffentliche Q&A pro Inserat** (Airbnb-Style)
4. **Berater-Datenraum-Zugang** (zeitlich begrenzt für Steuerberater)
5. **PWA Mobile-App** mit Push
6. **LinkedIn-SSO** für Trust
7. **AI-Chat-Suche** auf Marktplatz

### Für Anna (Verkäuferin)
8. **Live-Anonymitäts-Coach** während Tippen
9. **Bexio/Abacus-Import** für Finanzdaten
10. **Treuhänder-Freigabe-Flow** + Verified-Badge
11. **Anfrage-Scoring** (Käufer-Qualität 0–100)
12. **Wöchentlicher Report** + Optimization-Coach
13. **Panic-Button „Revoke all access"** im Datenraum
14. **Expert-Marketplace** (Berater-Vermittlung mit 20% passare-Provision)

### Für Lukas (Admin)
15. **AI-Pre-Check auf Moderations-Queue** (Zeit-Killer)
16. **Fraud-Detection-Dashboard** mit Risk-Score
17. **Granulare Admin-Rollen** (super/moderator/support/finance/content)
18. **Yesterday's-Digest** + KPI-Delta-Alerts
19. **DATEV/Bexio-Exporte** für Buchhaltung
20. **Öffentliche Status-Page** (status.passare.ch)

---

## 💡 DAS „LIEBER-ALS-COMPANYMARKET"-REZEPT

Drei Hebel, die zusammen die Plattform unwiderstehlich machen:

### Hebel 1: Geschwindigkeit durch Intelligenz
- Daily-Digest statt Alert-Flut
- AI-Chat-Suche statt Filter-Hölle
- AI-Pre-Check statt manuelle Moderation
- Anfrage-Scoring statt Inbox-Zero-Stress

### Hebel 2: Vertrauen durch Transparenz
- Anzahl Interessenten pro Inserat offen
- Benchmarks im Inserat sichtbar
- Verkäufer-Historie im Admin
- Öffentliche Status-Page

### Hebel 3: Kontrolle durch Kontext
- Berater können zeitlich begrenzt rein (Datenraum)
- Panic-Button für Verkäufer
- Granulare Admin-Rollen
- Fraud-Detection proaktiv

**Wenn diese 20 Punkte vor dem Launch drin sind, hat companymarket keine Chance mehr — nicht weil wir günstiger sind, sondern weil wir ihre User besser verstehen.**

---

## 📋 NEUE ETAPPEN-KANDIDATEN (aus Walkthrough)

Vorschlag für MASTER_PLAN-Erweiterung:

| # | Titel | Block | Priorität |
|---|---|---|---|
| 32.5 | AI-Chat-Suche auf Marktplatz | C | hoch |
| 34.1 | „Ist mein Unternehmen verkäuflich?"-Check | C | hoch |
| 47.1 | Daily-Digest + Optimization-Coach | D/E | hoch |
| 51.1 | Live-Anonymitäts-Coach im Wizard | D | kritisch |
| 51.2 | Buchhaltungs-Import (Bexio/Abacus/Sage) | D | kritisch |
| 54.1 | Anfrage-Scoring | D | hoch |
| 57.1 | Deal-Pipeline-Kanban | E | hoch |
| 60.1 | Öffentliche Q&A pro Inserat | C | mittel |
| 62.1 | Berater-Datenraum-Share (zeitlich begrenzt) | G | kritisch |
| 71.2 | Panic-Revoke-Button + „Wer hat was angeschaut" | G | hoch |
| 81.1 | Command-Center-Home + Yesterday-Digest | I | hoch |
| 82.1 | AI-Pre-Check + Bulk-Approval für Trust-Verkäufer | I | hoch |
| 83.1 | Fraud-Detection + Risk-Score | I | kritisch |
| 83.2 | Granulare Admin-Rollen | I | kritisch |
| 84.1 | DATEV/Bexio-Export + MwSt-Quartalsabrechnung | I | hoch |
| 89.1 | Sentiment-Analyse + Live-Chat + Canned-Responses | I | mittel |
| 90.1 | Öffentliche Status-Page | L | mittel |
| 103.1 | PWA + Push-Notifications | K | kritisch |
| 134.1 | Expert-Marketplace (Berater-Vermittlung) | N | mittel |
| 140.1 | Partner-Portal (Banken, Berater, Broker) | N | mittel |

---

*Walkthrough-Dokument erstellt: 24.04.2026 · 3 Personas × echte Workflows · 60 Gaps identifiziert, 20 davon Must-Fix*

*Update 27.04.2026: Alle 21 Etappen-Kandidaten direkt in `MASTER_PLAN.md` integriert (28.1, 32.5, 34.1, 47.1, 51.1, 51.2, 54.1, 56.1, 57.1, 62.1, 71.2, 81.1, 82.1, 83.1, 83.2, 84.1, 89.1, 90.1, 103.1, 134.1, 140.1). Master-Plan jetzt bei 196 Etappen total.*
