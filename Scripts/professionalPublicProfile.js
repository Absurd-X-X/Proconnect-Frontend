document.addEventListener("DOMContentLoaded", async () => {
  const loadingState = document.getElementById("loading-state");
  const content = document.getElementById("content");

  const token = localStorage.getItem("pc_token") || sessionStorage.getItem("pc_token");
  const viewerName = localStorage.getItem("pc_username");

  if (!token) {
    window.location.href = "login.html";
    return;
  }

  // This page shows SOMEONE ELSE's profile — the target ID comes from the
  // URL, not from localStorage (which holds the *logged-in viewer's* own
  // profile ID). Falls back to the viewer's own profile if no id is given,
  // so "View Public Profile" links without a param still work sensibly.
  const params = new URLSearchParams(window.location.search);
  const targetProfileId = params.get("id") || localStorage.getItem("pc_profile_id");

  if (!targetProfileId) {
    loadingState.innerHTML = `<span>No profile specified.</span>`;
    return;
  }

  const STATUS_INFO = {
    Available: { label: "Available", desc: "Actively looking for new opportunities", dot: "is-available" },
    OpenToOffers: { label: "Open to Offers", desc: "Open to interesting opportunities", dot: "is-open" },
    NotLooking: { label: "Not Looking", desc: "Not looking for new opportunities", dot: "is-not-looking" },
    NotAvailable: { label: "Not Available", desc: "Not available for new opportunities", dot: "is-unavailable" },
  };

  try {
    const response = await fetch(`${API_ROUTES.professionalProfile}/${targetProfileId}`, {
      method: "GET",
      headers: { "Authorization": `Bearer ${token}` },
    });

    if (response.status === 401) {
      ["pc_token", "pc_user_id", "pc_profile_id", "pc_role", "pc_username"].forEach((key) => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });
      window.location.href = "login.html?reason=session-expired";
      return;
    }

    const result = await response.json().catch(() => ({}));

    if (!response.ok || !result.data) {
      loadingState.innerHTML = `<span>Couldn't load this profile. Check the console for details.</span>`;
      console.error("Public profile fetch failed:", response.status, result);
      return;
    }

    render(result.data);

    loadingState.hidden = true;
    content.hidden = false;

  } catch (err) {
    console.error("Public profile fetch threw an error:", err);
    loadingState.innerHTML = `<span>Couldn't reach the server: ${err.message}.</span>`;
  }

  function render(profile) {
    const fullName = `${profile.firstName || ""} ${profile.lastName || ""}`.trim() || "ProConnect Member";
    const avatarSrc = profile.profilePicture || defaultAvatar(profile.firstName);

    // Topbar shows the person currently LOGGED IN (the viewer), not the
    // profile being viewed — that's an intentional distinction, not a bug.
    document.getElementById("topbar-name").textContent = viewerName || "You";
    document.getElementById("topbar-avatar").src = defaultAvatar(viewerName);
    const sidebarName = document.getElementById("sidebar-user-name");
    if (sidebarName) sidebarName.textContent = viewerName || "You";

    document.getElementById("vp-photo").src = avatarSrc;
    document.getElementById("vp-name").textContent = fullName;
    document.getElementById("vp-cta-name").textContent = fullName;

    document.getElementById("vp-verified").hidden = !profile.isVerified;
    document.getElementById("vp-verified-label").hidden = !profile.isVerified;

    document.getElementById("vp-headline").textContent = profile.headLine || "No headline added yet";

    const locEl = document.getElementById("vp-location");
    if (profile.location) {
      locEl.querySelector("span").textContent = profile.location;
      locEl.hidden = false;
    }

    const linkedinEl = document.getElementById("vp-linkedin");
    if (profile.linkedInUrl) {
      linkedinEl.href = profile.linkedInUrl;
      linkedinEl.querySelector("span").textContent = stripProtocol(profile.linkedInUrl);
      linkedinEl.hidden = false;
    }

    // Top skill chips beside the name (first 4, "+N" for the rest)
    const skills = profile.skills || [];
    const topSkills = skills.slice(0, 4);
    const remaining = skills.length - topSkills.length;
    document.getElementById("vp-top-skills").innerHTML =
      topSkills.map((s) => `<span class="chip">${escapeHtml(s.skillName)}</span>`).join("")
      + (remaining > 0 ? `<span class="chip">+${remaining}</span>` : "");

    document.getElementById("vp-about").textContent =
      profile.summary || "No summary added yet.";

    renderExperience(profile.experiences || []);
    renderEducation(profile.educations || []);
    renderSkills(profile.skills || []);
    renderCertifications(profile.certificates || []);
    renderPortfolio(profile.portfolioLinks || []);
    renderAvailability(profile);
    renderHighlights(profile);

    document.getElementById("vp-share-btn").addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(window.location.href);
        const btn = document.getElementById("vp-share-btn");
        btn.innerHTML = `<i class="ti ti-check" aria-hidden="true"></i> Link copied!`;
        setTimeout(() => { btn.innerHTML = `<i class="ti ti-share" aria-hidden="true"></i> Share Profile`; }, 1500);
      } catch (err) {
        console.error("Couldn't copy link:", err);
      }
    });

    document.getElementById("vp-more-toggle").querySelector("button").addEventListener("click", (e) => {
      e.stopPropagation();
      document.getElementById("vp-more-dropdown").classList.toggle("is-open");
    });
    document.addEventListener("click", (e) => {
      const menu = document.getElementById("vp-more-dropdown");
      if (!menu.parentElement.contains(e.target)) menu.classList.remove("is-open");
    });
  }

  function defaultAvatar(seed) {
    return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(seed || "U")}&backgroundColor=5B3FE0&textColor=ffffff`;
  }

  function stripProtocol(url) {
    return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
  }

  function renderExperience(list) {
    const el = document.getElementById("vp-experience-list");
    if (list.length === 0) {
      el.innerHTML = `<p class="empty-note">No experience added yet.</p>`;
      return;
    }
    el.innerHTML = list.map((e) => `
      <div class="timeline-item">
        <span class="timeline-item__logo">${initials(e.companyName)}</span>
        <div>
          <p class="timeline-item__title">${escapeHtml(e.jobTitle)}</p>
          <p class="timeline-item__sub">${escapeHtml(e.companyName)}</p>
          <span class="timeline-item__meta">${formatDate(e.startDate)} – ${e.isCurrentJob ? "Present" : formatDate(e.endDate)} · ${escapeHtml(e.location)}</span>
        </div>
      </div>
    `).join("");
  }

  function renderEducation(list) {
    const el = document.getElementById("vp-education-list");
    if (list.length === 0) {
      el.innerHTML = `<p class="empty-note">No education added yet.</p>`;
      return;
    }
    el.innerHTML = list.map((e) => `
      <div class="timeline-item">
        <span class="timeline-item__logo">${initials(e.institution)}</span>
        <div>
          <p class="timeline-item__title">${escapeHtml(e.degree)}</p>
          <p class="timeline-item__sub">${escapeHtml(e.institution)}</p>
          <span class="timeline-item__meta">${formatDate(e.startDate)} – ${e.endDate ? formatDate(e.endDate) : "Present"}</span>
        </div>
      </div>
    `).join("");
  }

  function renderSkills(list) {
    const el = document.getElementById("vp-skills-list");
    if (list.length === 0) {
      el.innerHTML = `<p class="empty-note">No skills added yet.</p>`;
      return;
    }
    const shown = list.slice(0, 8);
    const remaining = list.length - shown.length;
    el.innerHTML = shown.map((s) => `<span class="chip">${escapeHtml(s.skillName)}</span>`).join("")
      + (remaining > 0 ? `<span class="chip">+${remaining} more</span>` : "");
  }

  function renderCertifications(list) {
    const el = document.getElementById("vp-certifications-list");
    if (list.length === 0) {
      el.innerHTML = `<p class="empty-note">No certifications added yet.</p>`;
      return;
    }
    el.innerHTML = list.map((c) => `
      <div class="cert-item">
        <span class="cert-item__logo"><i class="ti ti-certificate" aria-hidden="true"></i></span>
        <div class="cert-item__body">
          <p class="cert-item__name">${escapeHtml(c.name)}</p>
          <span class="cert-item__org">${escapeHtml(c.issuingOrganization)}</span>
        </div>
        <span class="cert-item__date">Issued ${formatDate(c.issueDate)}</span>
      </div>
    `).join("");
  }

  function renderPortfolio(list) {
    const el = document.getElementById("vp-portfolio-list");
    if (list.length === 0) {
      el.innerHTML = `<p class="empty-note">No portfolio links added yet.</p>`;
      return;
    }
    el.innerHTML = list.map((l) => `
      <a href="${escapeAttr(l.url)}" target="_blank" rel="noopener" class="portfolio-link-row" data-link-id="${l.id}">
        <span class="portfolio-link-row__icon"><i class="ti ti-link" aria-hidden="true"></i></span>
        <div>
          <p class="portfolio-link-row__title">${escapeHtml(l.title)}</p>
          <span class="portfolio-link-row__url">${escapeHtml(stripProtocol(l.url))}</span>
        </div>
        <i class="ti ti-external-link portfolio-link-row__ext" aria-hidden="true"></i>
      </a>
    `).join("");

    el.querySelectorAll("[data-link-id]").forEach((a) => {
      a.addEventListener("click", () => {
        fetch(`${API_BASE_URL}/Professional/track-portfolio-link-click`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: a.dataset.linkId }),
        }).catch(() => {});
      });
    });
  }

  function renderAvailability(profile) {
    const el = document.getElementById("vp-availability");
    if (profile.availabilityVisibility === "Hidden") {
      el.innerHTML = `<p class="empty-note">This person has hidden their availability.</p>`;
      return;
    }
    const info = STATUS_INFO[profile.availabilityStatus] || { label: profile.availabilityStatus, desc: "", dot: "" };
    el.innerHTML = `
      <div class="availability-row">
        <span class="status-dot ${info.dot}"></span> ${info.label}
      </div>
      <p class="availability-row__desc">${info.desc}</p>
    `;
  }

  function renderHighlights(profile) {
    const el = document.getElementById("vp-highlights");
    const years = yearsOfExperience(profile.experiences || []);
    const projectCount = (profile.projects || []).length;

    const items = [];
    if (years > 0) {
      items.push({ icon: "ti-award", label: `${years}+ Years of Experience` });
    }
    if (projectCount > 0) {
      items.push({ icon: "ti-briefcase", label: `${projectCount} Project${projectCount === 1 ? "" : "s"}` });
    }

    if (items.length === 0) {
      el.innerHTML = `<p class="empty-note">Not enough data yet to show highlights.</p>`;
      return;
    }

    el.innerHTML = items.map((i) => `
      <div class="vp-highlight-item">
        <span class="vp-highlight-item__icon"><i class="ti ${i.icon}" aria-hidden="true"></i></span>
        <strong>${i.label}</strong>
      </div>
    `).join("");
  }

  // Computed, not stored: years since the earliest experience start date.
  // "Top Rated" from the reference design is deliberately omitted — no
  // review/rating system exists in the backend to back that claim.
  function yearsOfExperience(experiences) {
    if (experiences.length === 0) return 0;
    const earliest = experiences.reduce((min, e) => {
      const d = new Date(e.startDate);
      return d < min ? d : min;
    }, new Date());
    const years = (new Date() - earliest) / (1000 * 60 * 60 * 24 * 365.25);
    return Math.floor(years);
  }

  function initials(name) {
    if (!name) return "?";
    return name.trim().charAt(0).toUpperCase();
  }

  function formatDate(dateStr) {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", year: "numeric" });
  }

  function escapeHtml(str) {
    if (str == null) return "";
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function escapeAttr(str) {
    return escapeHtml(str).replace(/"/g, "&quot;");
  }
});