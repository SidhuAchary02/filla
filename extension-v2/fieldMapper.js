/**
 * fieldMapper.js
 * Filla Autofill — Field Detection & Mapping Engine
 * Injected as a content script; exposes window.FillaFieldMapper
 */

(function () {
    "use strict";

    // ─── Keyword Map ──────────────────────────────────────────────────────────
    // Maps profile keys → arrays of normalized keywords to match against
    const KEYWORD_MAP = {
        first_name: ["first name", "firstname", "first-name", "fname", "given name", "given-name"],
        last_name: ["last name", "lastname", "last-name", "lname", "surname", "family name"],
        full_name: ["full name", "fullname", "full-name", "your name", "complete name", "name"],
        email: ["email", "e-mail", "email address", "mail"],
        phone: ["phone", "mobile", "cell", "contact number", "telephone", "tel", "whatsapp"],
        gender: ["gender", "sex"],
        role: ["role", "job title", "position", "designation", "title", "current role", "applying for"],
        experience: ["experience", "years of experience", "exp", "experience level", "work experience"],
        current_ctc: ["current ctc", "current salary", "current compensation", "present salary", "existing ctc"],
        min_salary: ["expected salary", "expected ctc", "desired salary", "desired Pay", "salary expectation", "minimum salary", "target salary", "min salary", "package"],
        notice_period: ["notice period", "notice", "joining", "availability", "when can you join", "start date"],
        city: ["city", "location", "current city", "current location", "place"],
        pincode: ["pincode", "postal code", "zip", "zip code"],
        state: ["state", "province", "region"],
        country: ["country", "nation"],
        address: ["address", "street", "residence"],
        skills: ["skills", "tech stack", "technologies", "tools", "expertise", "core skills"],
        languages: ["languages", "language", "spoken languages"],
        linkedin: ["linkedin", "linkedin url", "linkedin profile"],
        github: ["github", "github url", "github profile"],
        portfolio: ["portfolio", "website", "personal website", "portfolio url"],
        preferred_name: ["preferred name", "nickname", "display name", "known as"],
    };

    // ─── Profile Value Resolver ────────────────────────────────────────────────
    function resolveValue(key, userData) {
        const p = userData.profile;
        const loc = p.location || {};

        const valueMap = {
            first_name: p.first_name,
            last_name: p.last_name,
            full_name: `${p.first_name} ${p.last_name}`,
            preferred_name: p.preferred_name,
            email: userData.email,
            phone: p.phone,
            gender: p.gender,
            role: p.role,
            experience: p.experience_level,
            current_ctc: String(p.current_ctc),
            min_salary: String(p.min_salary),
            notice_period: p.notice_period,
            city: loc.city,
            state: loc.state,
            pincode: loc.pincode,
            country: loc.country,
            address: p.address,
            skills: Array.isArray(p.skills)
                ? p.skills.map(s => s.name || s).join(", ")
                : p.skills,
            languages: Array.isArray(p.languages) ? p.languages.join(", ") : p.languages,
            linkedin: p.links?.linkedin,
            github: p.links?.github,
            portfolio: p.links?.portfolio,
        };

        return valueMap[key] ?? null;
    }

    // ─── Normalize text helper ─────────────────────────────────────────────────
    function normalize(str) {
        if (!str) return "";
        return str
            .toLowerCase()
            .replace(/[_\-*]/g, " ")
            .replace(/\s+/g, " ")
            .trim();
    }

    // ─── Extract fingerprint from a field element ──────────────────────────────
    function extractFingerprint(el) {
        const raw = [
            el.getAttribute("name") || "",
            el.getAttribute("id") || "",
            el.getAttribute("placeholder") || "",
            el.getAttribute("aria-label") || "",
            el.getAttribute("aria-labelledby") || "",
            el.getAttribute("autocomplete") || "",
            el.dataset?.label || "",
            (() => {
                // Try to grab <label> text associated with the element
                if (el.id) {
                    const label = document.querySelector(`label[for="${el.id}"]`);
                    if (label) return label.innerText || label.textContent || "";
                }
                // Closest label ancestor
                const closest = el.closest("label");
                if (closest) return closest.innerText || closest.textContent || "";
                // Preceding sibling label
                let prev = el.previousElementSibling;
                while (prev) {
                    if (prev.tagName === "LABEL") return prev.innerText || prev.textContent || "";
                    prev = prev.previousElementSibling;
                }
                // Parent container text (shallow)
                const parent = el.parentElement;
                if (parent) return parent.innerText?.slice(0, 80) || "";
                return "";
            })(),
        ];
        return normalize(raw.join(" "));
    }

    // ─── Match fingerprint to a profile key ───────────────────────────────────
    function matchKey(fingerprint) {
        let bestKey = null;
        let bestScore = 0;

        for (const [key, keywords] of Object.entries(KEYWORD_MAP)) {
            for (const kw of keywords) {
                if (fingerprint.includes(kw)) {
                    // Prefer longer keyword matches (more specific)
                    if (kw.length > bestScore) {
                        bestScore = kw.length;
                        bestKey = key;
                    }
                }
            }
        }

        return bestKey;
    }

    // ─── Public API ────────────────────────────────────────────────────────────
    window.FillaFieldMapper = {
        extractFingerprint,
        matchKey,
        resolveValue,
        normalize,
        KEYWORD_MAP,
    };
})();