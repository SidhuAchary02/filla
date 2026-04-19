/**
 * fieldMapper.js  v4
 * Filla Autofill — Field Detection & Mapping Engine
 *
 * FIXES vs v3:
 *  1. nationality → was matching location_fallback("location") → "Mumbai"
 *     Now has its own key resolving to loc.country = "India"
 *  2. Work Experience section: added exact labels from this form:
 *     "company name", "date of joining", "date of relieving", "currently working here"
 *  3. Education section: added exact labels from this form:
 *     "course", "branch/ specialization", "start of course", "end of course",
 *     "university/ college"
 *  4. github/portfolio: "github/portfolio link" label now matched
 *  5. notice_period: "official notice period (in days)" → returns days as number
 *  6. Removed "location" from location_fallback to stop it polluting other matches
 *  7. Expected salary: "expected salary" keyword — returns raw number for number input
 */

(function () {
  "use strict";

  /* ═══════════════════════════════════════════════════════════════
     KEYWORD MAP
     RULES:
       • Only fingerprint.includes(keyword) is used (no reverse)
       • Longer keyword wins (more specific)
       • Order within array doesn't matter — length decides
       • NEVER put a very short word like "name" / "location" in a
         high-priority key — it will match almost everything
  ═══════════════════════════════════════════════════════════════ */
  const KEYWORD_MAP = {

    /* ── Personal info ─────────────────────────────────────────── */
    first_name:     ["first name", "firstname", "fname", "given name"],
    last_name:      ["last name", "lastname", "lname", "surname", "family name"],
    full_name:      ["full name", "fullname", "your name", "complete name"],
    preferred_name: ["preferred name", "nickname", "display name", "known as"],
    middle_name:    ["middle name"],
    suffix:         ["suffix", "salutation"],
    email:          ["email address", "email", "e-mail"],
    phone_country_code: [
      "phone country code",
      "country code",
      "dial code",
      "isd code",
      "calling code",
    ],
    phone_number_only: [
      "phone number",
      "mobile number",
      "contact number",
    ],
    phone:          ["mobile phone", "phone number", "contact number", "telephone", "mobile", "phone", "whatsapp"],
    birthday:       ["date of birth", "birthday", "birth date", "dob"],
    gender:         ["gender", "sex"],
    ethnicity:      ["ethnicity", "race"],
    disability:     ["disability", "disabled"],
    veteran:        ["veteran", "military"],
    sponsorship:    ["visa sponsorship", "sponsorship required", "work visa", "sponsorship"],
    work_auth_us:   ["authorized to work in the us", "us work authorization"],
    work_auth_uk:   ["authorized to work in the uk", "uk work authorization"],
    work_auth_ca:   ["authorized to work in canada", "canada work authorization"],
    work_auth_general: [
      "legally authorized to work in the country where you are applying",
      "authorized to work in the country where you are applying",
      "legally authorized to work",
      "work authorization",
    ],

    /* ── Nationality (its own key — MUST NOT fall to location) ── */
    nationality:    ["nationality"],

    /* ── Job / Career ──────────────────────────────────────────── */
    role:           ["job title", "position applied", "designation", "applying for", "current role"],
    experience:     [
                      "how many years of it professional experience do you have",
                      "experience (in years)",   // ← exact label on this form
                      "years of experience",
                      "total experience",
                      "full time experience",
                      "years experience",
                      "experience level",
                      "experience in years",
                    ],
    internship_exp: ["internship experience", "intern experience", "internship months"],
    current_ctc:    ["current ctc", "current salary", "current compensation", "present salary", "existing ctc"],
    min_salary:     [
                      "expected salary",         // ← exact label on this form
                      "expected ctc",
                      "desired salary",
                      "desired pay",
                      "salary expectation",
                      "minimum salary",
                      "target salary",
                      "min salary",
                    ],
    notice_period:  [
                      "official notice period",  // ← exact label on this form ("official notice period (in days)")
                      "notice period",
                      "notice (in days)",
                      "availability",
                      "when can you join",
                    ],
    negotiable_np:  ["early can you join", "if the np is negotiable", "negotiable"],
    serving_np:     ["serving np", "currently serving notice", "serving notice"],
    lwd:            ["lwd", "last working day"],
    job_platform:   ["platform did you learn", "how did you hear", "source", "referral"],
    job_search:     ["job search timeline", "actively looking"],
    preferred_loc:  ["preferred location"],
    english_proficiency: [
      "what is your english proficiency level",
      "english proficiency level",
      "english proficiency",
      "proficiency level",
    ],
    technical_degree: [
      "do you have a technical degree or a 4 year college degree",
      "do you have a technical degree or a 4-year college degree",
      "technical degree or a 4 year college degree",
      "technical degree",
      "college degree",
    ],

    /* ── Work Experience section ───────────────────────────────── */
    // Exact labels used on this form:
    //   "Company Name" | "Job Title" | "Currently working here"
    //   "Date of Joining" | "Date of Relieving" | "Location"
    work_company:     ["company name"],                      // "Company Name" → longest unique match
    work_title:       ["job title"],
    work_currently:   ["currently working here", "currently work here", "i currently work"],
    work_start:       ["date of joining", "work start", "work from", "joining date", "start date"],
    work_end:         ["date of relieving", "date of leaving", "work end", "work to", "end date", "relieving date", "leaving date"],
    work_description: ["role description", "job description", "responsibilities", "describe your role"],

    /* ── Education section ─────────────────────────────────────── */
    // Exact labels on this form:
    //   "Course" | "Branch/ Specialization" | "Start of Course"
    //   "End of Course" | "University/ College" | "Location"
    degree:         ["course"],                              // "Course" → degree
    field_of_study: ["branch/ specialization", "branch/specialization", "branch specialization",
                     "field of study", "specialization", "major", "stream", "branch"],
    edu_start:      ["start of course", "education from", "enrollment", "edu start", "admission year", "start of education"],
    edu_end:        ["end of course",   "education to",   "completion", "edu end",   "graduation", "passing year", "expected graduation"],
    school:         ["university/ college", "university/college", "university college",
                     "school or university", "institution", "university", "college", "school name", "school"],
    gpa:            ["overall result", "gpa", "cgpa", "grade", "percentage", "score"],
    edu_location:   ["education location"],                  // rare — avoid capturing work location

    /* ── Location ──────────────────────────────────────────────── */
    city:    ["current location", "current city", "city"],
    state:   ["state", "province", "region"],
    country: ["what country are you located in", "country"],
    pincode: ["pincode", "postal code", "zip code", "zip"],
    address: ["address", "street", "residence"],

    /* ── Skills / Languages ────────────────────────────────────── */
    skills:    ["tech stack", "technologies", "tools", "expertise", "core skills", "skills"],
    languages: ["spoken languages", "languages", "language"],

    /* ── Links ─────────────────────────────────────────────────── */
    // "Github/Portfolio Link" is ONE field on this form → resolve as portfolio (primary)
    github_portfolio: ["github/portfolio link", "github/portfolio"],
    linkedin:         ["linkedin url", "linkedin profile", "linkedin"],
    github:           ["github url", "github profile", "github link", "github"],
    portfolio:        ["portfolio url", "portfolio link", "personal website", "personal site", "personal portfolio" ,"website url", "portfolio"],

    /* ── Fallback — keep SHORT keywords LAST and at LOWEST priority ─ */
    current_company: ["current company", "present company"],
    name_fallback: ["name"],
    // NOTE: "location" deliberately removed from any key to avoid false matches.
    //       Work/edu location is handled by section-specific logic in content.js.
  };

  /* ═══════════════════════════════════════════════════════════════
     DATE HELPERS
  ═══════════════════════════════════════════════════════════════ */
  function toYYYY(dateStr) {
    if (!dateStr) return "";
    return new Date(dateStr).getFullYear().toString();
  }

  function toMMYYYY(dateStr) {
    if (!dateStr) return "";
    const d  = new Date(dateStr);
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    return `${mm}/${d.getFullYear()}`;
  }

  // Convert ISO date → DD/MM/YYYY (some forms use this for LWD)
  function toDDMMYYYY(dateStr) {
    if (!dateStr) return "NA";
    const d  = new Date(dateStr);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    return `${dd}/${mm}/${d.getFullYear()}`;
  }

  /* ═══════════════════════════════════════════════════════════════
     PROFILE VALUE RESOLVER
     context = { section: "work"|"education"|"", index: 0|1|... }
  ═══════════════════════════════════════════════════════════════ */
  function resolveValue(key, userData, context) {
    const p   = userData.profile || {};
    const loc = p.location      || {};
    const ctx = context || { section: "", index: 0 };

    const workList = Array.isArray(p.work_experience) ? p.work_experience : [];
    const eduList  = Array.isArray(p.education)       ? p.education       : [];

    // Pick correct array entry based on section index
    const job = workList[ctx.index] ?? workList[0] ?? {};
    const edu = eduList[ctx.index]  ?? eduList[0]  ?? {};

    function normalizeCountryName(raw) {
      const v = String(raw || "").trim().toLowerCase();
      if (!v) return "";
      if (v === "indian") return "India";
      return String(raw || "").trim();
    }

    function getInternshipMonths() {
      let total = 0;
      workList.forEach(e => {
        if (!e?.title?.toLowerCase().includes("intern")) return;
        const s  = new Date(e.start_date);
        const en = e.is_current ? new Date() : new Date(e.end_date);
        if (isNaN(s) || isNaN(en)) return;
        total += Math.max(
          (en.getFullYear() - s.getFullYear()) * 12 + (en.getMonth() - s.getMonth()), 0
        );
      });
      return total;
    }

    function isoToDial(iso) {
      const map = {
        IN: "+91",
        US: "+1",
        GB: "+44",
        CA: "+1",
        AU: "+61",
        SG: "+65",
        AE: "+971",
      };
      const k = String(iso || "").trim().toUpperCase();
      return map[k] || "";
    }

    function buildPhoneNumber() {
      const cc = String(p.phone_country_code || "").trim();
      const num = String(p.phone_number || "").trim();
      const whole = String(p.phone || "").trim();
      if (whole) return whole;
      if (cc && num) return `${cc} ${num}`;
      return num || cc || "";
    }

    function phoneCountryCode() {
      const cc = String(p.phone_country_code || "").trim();
      if (cc) return cc;
      const byIso = isoToDial(p.phone_country_iso);
      if (byIso) return byIso;
      const fromPhone = String(p.phone || "").trim().match(/^\s*(\+\d{1,4})\b/);
      if (fromPhone?.[1]) return fromPhone[1];
      return "";
    }

    function hasTechnicalDegree() {
      return eduList.length > 0 ? "Yes" : "No";
    }

    // Notice period: convert "immediate" → 0 days for number fields
    function noticeDays() {
      const np = String(p.notice_period || "").toLowerCase();
      if (np.includes("immediate")) return 0;
      const m = np.match(/(\d+)/);
      return m ? parseInt(m[1]) : np;
    }

    const map = {
      /* Personal */
      first_name:       p.first_name,
      last_name:        p.last_name,
      full_name:        `${p.first_name || ""} ${p.last_name || ""}`.trim(),
      preferred_name:   p.preferred_name,
      middle_name:      p.middle_name,
      suffix:           p.suffix_name,
      email:            userData.email,
      phone_country_code: phoneCountryCode(),
      phone_number_only:  p.phone_number || "",
      phone:            buildPhoneNumber(),
      birthday:         p.birthday,
      gender:           p.gender,
      ethnicity:        p.ethnicity,
      disability:       p.disability,
      veteran:          p.veteran,
      sponsorship:      p.sponsorship_required,
      work_auth_us:     p.work_authorized_us,
      work_auth_uk:     p.work_authorized_uk,
      work_auth_ca:     p.work_authorized_canada,
      work_auth_general: p.work_authorized || p.work_authorized_in_country || "Yes",

      /* FIX #1: Nationality → country ("India"), NOT city */
      nationality:      normalizeCountryName(p.nationality || loc.country),

      /* Career */
      role:             p.role,
      experience:       0,                                   // fresher — 0 full-time years
      internship_exp:   getInternshipMonths(),
      current_ctc:      p.current_ctc,
      min_salary:       p.min_salary,
      notice_period:    noticeDays(),                        // 0 for "immediate"
      negotiable_np:    0,                                   // can join immediately
      serving_np:       "No",
      lwd:              "NA",
      job_platform:     "",
      job_search:       p.job_search_timeline,
      preferred_loc:    `${loc.city}, ${loc.country}`,
      english_proficiency: p.english_proficiency || p.english_level || "Professional",
      technical_degree: hasTechnicalDegree(),

      /* FIX #2: Work section — resolved per ctx.index */
      work_company:     job.company     || "",
      current_company:  job.company     || "",
      work_title:       job.title       || p.role || "",
      work_currently:   job.is_current  ? "yes" : "no",
      work_start:       toMMYYYY(job.start_date),
      work_end:         job.is_current  ? "" : toMMYYYY(job.end_date),
      work_description: job.description || "",
      // Location inside work section — resolved from job data
      work_location_val: job.location   || loc.city || "",

      /* FIX #3: Education section — resolved per ctx.index */
      degree:           edu.degree      || "",               // "b.tech"
      field_of_study:   edu.major       || "",               // "aids"
      edu_start:        toYYYY(edu.start_date),              // "2023"
      edu_end:          toYYYY(edu.end_date),                // "2027"
      school:           edu.school      || "",               // "university of mumbai"
      gpa:              edu.gpa         || edu.percentage    || "",
      edu_location:     loc.city        || "",

      /* Location */
      city:             loc.city,
      state:            loc.state,
      country:          loc.country,
      pincode:          loc.pincode,
      address:          p.address,

      /* Skills / Languages */
      skills:    Array.isArray(p.skills)
                   ? p.skills.map(s => s?.name || s).join(", ")
                   : (p.skills || ""),
      languages: Array.isArray(p.languages)
                   ? p.languages.join(", ")
                   : (p.languages || ""),

      /* Links */
      // "Github/Portfolio Link" expects one valid URL, not a combined string.
      github_portfolio: p.links?.portfolio || p.links?.github || p.links?.linkedin || "",
      linkedin:         p.links?.linkedin,
      github:           p.links?.github,
      portfolio:        p.links?.portfolio || p.links?.github || p.links?.linkedin || "",

      /* Fallbacks */
      name_fallback:    `${p.first_name || ""} ${p.last_name || ""}`.trim(),
    };

    return map[key] ?? null;
  }

  /* ═══════════════════════════════════════════════════════════════
     NORMALIZE
  ═══════════════════════════════════════════════════════════════ */
  function normalize(str) {
    if (str === null || str === undefined) return "";
    return String(str)
      .toLowerCase()
      .replace(/[_\-*/\\()\[\]]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  /* ═══════════════════════════════════════════════════════════════
     EXTRACT FINGERPRINT
  ═══════════════════════════════════════════════════════════════ */
  function extractFingerprint(el) {
    const parts = [
      el.getAttribute("name")            || "",
      el.getAttribute("id")              || "",
      el.getAttribute("placeholder")     || "",
      el.getAttribute("aria-label")      || "",
      el.getAttribute("aria-labelledby") || "",
      el.getAttribute("autocomplete")    || "",
      el.dataset?.label                  || "",
      el.dataset?.key                    || "",
    ];

    // <label for="id">
    if (el.id) {
      try {
        const lbl = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
        if (lbl) parts.push(lbl.innerText || lbl.textContent || "");
      } catch (_) {}
    }

    // Wrapping <label>
    const wrapLabel = el.closest("label");
    if (wrapLabel) parts.push(wrapLabel.innerText || wrapLabel.textContent || "");

    // Preceding siblings (up to 4 steps) that look like labels
    let prev = el.previousElementSibling;
    let steps = 0;
    while (prev && steps < 4) {
      const tag = prev.tagName?.toLowerCase();
      if (["label", "span", "div", "p", "h1", "h2", "h3", "h4", "legend"].includes(tag)) {
        parts.push(prev.innerText || prev.textContent || "");
        if (tag === "label") break;
      }
      prev = prev.previousElementSibling;
      steps++;
    }

    // Parent container text (strip nested inputs first)
    const parent = el.parentElement;
    if (parent) {
      try {
        const clone = parent.cloneNode(true);
        clone.querySelectorAll("input,select,textarea,button,option").forEach(n => n.remove());
        parts.push((clone.innerText || clone.textContent || "").slice(0, 120));
      } catch (_) {}
    }

    // Closest fieldset legend
    const legend = el.closest("fieldset")?.querySelector("legend");
    if (legend) parts.push(legend.innerText || legend.textContent || "");

    return normalize(parts.join(" "));
  }

  /* ═══════════════════════════════════════════════════════════════
     MATCH KEY
     Only fingerprint.includes(keyword). Longest keyword wins.
  ═══════════════════════════════════════════════════════════════ */
  function matchKey(fingerprint) {
    if (!fingerprint) return null;
    let bestKey = null, bestScore = 0;

    for (const [key, keywords] of Object.entries(KEYWORD_MAP)) {
      for (const kw of keywords) {
        if (fingerprint.includes(kw) && kw.length > bestScore) {
          bestScore = kw.length;
          bestKey   = key;
        }
      }
    }
    return bestKey;
  }

  /* ═══════════════════════════════════════════════════════════════
     PUBLIC API
  ═══════════════════════════════════════════════════════════════ */
  window.FillaFieldMapper = {
    extractFingerprint,
    matchKey,
    resolveValue,
    normalize,
    KEYWORD_MAP,
    toMMYYYY,
    toYYYY,
    toDDMMYYYY,
  };
})();
