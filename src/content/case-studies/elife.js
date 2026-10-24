// Based on the supplied project description and team result.
export const elifeCaseStudy = [
  {
    "section": "The challenge",
    "title": "Your government,<br>itemised.",
    "body": "<p class=\"case-category\">TEAM PIRACY++ / EGOVHACKATHON 2026</p><p class=\"document-lead\">An eGovPH hackathon project that itemizes unclaimed citizen benefits using verified records, deterministic rules, and auditable eligibility receipts.</p><section class=\"case-section\"><h3>The discovery gap</h3><p>A service can exist without reaching the person who needs it. eLife starts with the citizen's circumstances: what could I receive, why do I qualify, and what can I do next?</p></section>"
  },
  {
    "section": "The product",
    "title": "One place to start.",
    "body": "<figure class=\"case-showcase\"><img src=\"/assets/projects/elife.png\" alt=\"eLife: Your Government. Your Life. One Platform.\" width=\"1146\" height=\"660\"><figcaption>eLife / eGovPH hackathon prototype</figcaption></figure><p class=\"document-lead\">A citizen-facing statement of account makes estimated entitlements visible, with an itemised ledger beneath the headline amount.</p>"
  },
  {
    "section": "The citizen journey",
    "title": "From record<br>to next step.",
    "body": "<ol class=\"case-steps\"><li><b>Discover.</b> Sign in to an itemised ledger of estimated benefits and eligible programs.</li><li><b>Understand.</b> Open a program to see its criteria, the citizen's values, and the supporting source.</li><li><b>Act.</b> Check documents and offices, apply, then follow the application's status.</li></ol>"
  },
  {
    "section": "A longer perspective",
    "title": "Plan beyond today.",
    "body": "<section class=\"case-section\"><h3>Look further ahead</h3><p>The Path view shows how eligibility changes with age, helping citizens explore what may open up later and what they may age out of.</p></section><p class=\"document-lead\">A citizen can explore future eligibility instead of discovering a program only after reaching its age threshold.</p>"
  },
  {
    "section": "The trust boundary",
    "title": "AI is the door.<br>Never the judge.",
    "body": "<p class=\"document-lead\">Citizens can describe their circumstances in English, Filipino, or Taglish. AI interprets the intake and phrases a response. It does not decide eligibility.</p>\n      <div class=\"case-rule-flow\"><span>Citizen's words</span><span>AI-assisted fact intake</span><span>Verified facts + deterministic rules</span><span>Explainable eligibility receipt</span></div>"
  },
  {
    "section": "Explainable decisions",
    "title": "A receipt.<br>Not a black box.",
    "body": "<section class=\"case-section\"><h3>Show the reasoning</h3><p>Each determination records the criteria checked, the citizen's actual values, and the law or department order supporting the rule.</p></section>\n      <section class=\"case-section\"><h3>Make the estimate traceable</h3><p>Benefit values remain estimates tied to a cited source. The ledger separates benefit types rather than treating different forms of support as interchangeable.</p></section>\n      <div class=\"case-pullquote\">A citizen should be able to understand why a result appeared.</div>"
  },
  {
    "section": "Data & accountability",
    "title": "Keep the record thin.",
    "body": "<section class=\"case-section\"><h3>Identity stays with PhilSys</h3><p>eLife stores derived facts, an opaque eGov subject ID, application references, and statuses. It avoids retaining names, PhilSys numbers, or identity documents.</p></section><p class=\"case-caption\">The Account screen shows citizens the information the system retains.</p>"
  },
  {
    "section": "Rule history",
    "title": "Keep decisions traceable.",
    "body": "<section class=\"case-section\"><h3>Preserve the decision history</h3><p>Supabase holds programs and eligibility rules. Rule changes are versioned, so earlier determinations retain their original basis. Schema restrictions and row-level security support this approach.</p></section><p class=\"document-lead\">The seed process versions rule changes rather than overwriting them, preserving the basis for an earlier determination.</p>"
  },
  {
    "section": "Design & accessibility",
    "title": "A familiar service.",
    "body": "<section class=\"case-section\"><h3>Keep the service familiar</h3><p>The interface uses white cards, cool gray backgrounds, eGovPH blue, and Plus Jakarta Sans. A blue hero presents the headline estimate; the ledger breaks it down below.</p></section>"
  },
  {
    "section": "Accessibility",
    "title": "Design for more citizens.",
    "body": "<section class=\"case-section\"><h3>Design for more citizens</h3><p>Visible keyboard focus, semantic landmarks, reduced-motion support, and contrast considerations support an audience that includes seniors and people with disabilities.</p></section><p class=\"case-caption\">The light-only presentation also keeps the hackathon demo consistent across projector and browser settings.</p>"
  },
  {
    "section": "Prototype demonstration",
    "title": "Show the<br>whole loop.",
    "body": "<div class=\"case-demo-figure\"><strong>₱163,000</strong><span>across 7 programs / scripted demo scenario</span></div><p class=\"document-lead\">The demo follows a citizen from estimated benefits to a receipt and an application. The ledger then reflects the claimed amount.</p><p class=\"case-caption\">The scenario does not establish real benefit awards or measured citizen outcomes.</p>"
  },
  {
    "section": "Resilience",
    "title": "Honest when offline.",
    "body": "<section class=\"case-section\"><h3>Honest when offline</h3><p>Missing services fall back to fixtures; a missing database uses the seed catalogue. The interface labels those states. Demo mode runs without network calls.</p></section><p class=\"document-lead\">The Account screen identifies available integrations, and demo mode offers an offline dry run with zero network calls.</p>"
  },
  {
    "section": "The team result",
    "title": "Top 30.<br>Out of 156.",
    "body": "<div class=\"case-finalist-figure\"><strong>30 <span>/ 156</span></strong><span>FINALIST TEAMS / EGOVHACKATHON 2026</span></div><p class=\"document-lead\">Team Piracy++ placed among the top 30 teams out of 156 at eGovHackathon 2026.</p><p class=\"case-team-context\">The result is a milestone for the team and the prototype: a proposal for making government benefits easier to discover and understand.</p>"
  },
  {
    "section": "Team Piracy++",
    "title": "The people behind eLife.",
    "body": "<div class=\"case-team-layout\"><figure class=\"case-team-photo\"><img src=\"/assets/egov_group.png\" alt=\"Team Piracy++ holding the eGovHackathon 2026 top-30 finalist award\" width=\"1536\" height=\"2048\"><figcaption>Team Piracy++<br>eGovHackathon 2026 finalists</figcaption></figure><section class=\"case-team-roster\" aria-label=\"Team members\"><h3>Team Piracy++</h3><ul><li>Mark Eron Diaz</li><li>John Janiel Obmerga</li><li>Kurt Laurence Tendero</li><li>Deux Marq Marquez</li><li>Martin Dominic Luspo</li></ul></section></div>"
  },
  {
    "section": "Reflection",
    "title": "Make trust<br>testable.",
    "body": "<section class=\"case-section\"><h3>Test the rules engine</h3><p>The project notes identify automated tests for the rules engine as an important next step. The deterministic design provides a clear basis for checking decisions.</p></section><p class=\"document-lead\">Explainable decisions provide a foundation. Automated tests are the next step toward checking that those decisions remain consistent as the catalogue changes.</p>"
  },
  {
    "section": "Next steps",
    "title": "A broader picture.",
    "body": "<section class=\"case-section\"><h3>Extend the view</h3><p>An agency-side view of unclaimed eligibility by region is another proposed addition. It would extend the citizen experience into a broader picture of unmet needs.</p></section><p class=\"case-caption\">eLife is a hackathon prototype, with further validation and development ahead.</p>"
  }
];
