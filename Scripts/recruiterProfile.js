document.addEventListener("DOMContentLoaded", async () => {
  const loadingState = document.getElementById("loading-state");
  const alertBox = document.getElementById("form-alert");
  const profileLayout = document.getElementById("profile-layout");

  const token = localStorage.getItem("pc_token") || sessionStorage.getItem("pc_token");

  function showAlert(message) {
    alertBox.textContent = message;
    alertBox.hidden = false;
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str ?? "";
    return div.innerHTML;
  }

  // ---------------- Tabs ----------------

  document.querySelectorAll(".profile-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".profile-tab").forEach((t) => t.classList.remove("is-active"));
      document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("is-active"));
      tab.classList.add("is-active");
      document.querySelector(`[data-tab-panel="${tab.dataset.tab}"]`).classList.add("is-active");
    });
  });

  // ---------------- Render ----------------

  function renderProfile(p) {
    const avatar = document.getElementById("profile-avatar");
    avatar.innerHTML = p.profilePictureUrl
      ? `<img src="${p.profilePictureUrl}" alt="${escapeHtml(p.fullName)}" />`
      : escapeHtml(p.fullName.charAt(0));

    document.getElementById("recruiter-name").textContent = p.fullName;
    document.getElementById("role-badge").textContent = p.isCompanyAdmin ? "Company Admin" : "Recruiter";

    const metaParts = [p.jobTitle, p.department].filter(Boolean);
    document.getElementById("recruiter-meta").textContent = metaParts.join(" · ") || "Recruiter";

    const contactRow = document.getElementById("contact-row");
    const contactItems = [
      { icon: "ti-mail", value: p.email },
      p.tel ? { icon: "ti-phone", value: p.tel } : null,
      p.location ? { icon: "ti-map-pin", value: p.location } : null,
      { icon: "ti-calendar", value: `Joined ${new Date(p.dateCreated).toLocaleDateString()}` },
    ].filter(Boolean);

    contactRow.innerHTML = contactItems
      .map((c) => `<span><i class="ti ${c.icon}" aria-hidden="true"></i> ${escapeHtml(c.value)}</span>`)
      .join("");

    document.getElementById("recruiter-bio").textContent = p.bio || "No summary added yet.";

    // Stats — only real, derivable numbers
    const stats = [
      { icon: "ti-briefcase", value: p.openJobCount, label: "Open Jobs" },
      { icon: "ti-user-check", value: p.totalHireCount, label: "Total Hires" },
    ];

    document.getElementById("stats-grid").innerHTML = stats
      .map(
        (s) => `
        <div class="stat-item">
          <span class="stat-item__icon"><i class="ti ${s.icon}" aria-hidden="true"></i></span>
          <div>
            <div class="stat-item__value">${s.value}</div>
            <div class="stat-item__label">${s.label}</div>
          </div>
        </div>`
      )
      .join("");

    // Connected company
    const connectedCard = document.getElementById("connected-company-card");
    const noCompanyCard = document.getElementById("no-company-card");

    if (p.companyId) {
      connectedCard.hidden = false;
      noCompanyCard.hidden = true;

      document.getElementById("connected-company").innerHTML = `
        <div class="connected-company__logo">
          ${
            p.companyLogoUrl
              ? `<img src="${p.companyLogoUrl}" alt="${escapeHtml(p.companyName)} logo" />`
              : escapeHtml((p.companyName || "?").charAt(0))
          }
        </div>
        <div>
          <div class="connected-company__name">
            ${escapeHtml(p.companyName)}
          </div>
          <div class="connected-company__meta">${escapeHtml(p.companyIndustry || "")}${p.companyCompanySize ? " · " + escapeHtml(p.companyCompanySize) : ""}</div>
        </div>
      `;

      localStorage.setItem("pc_company_id", p.companyId);
    } else {
      connectedCard.hidden = true;
      noCompanyCard.hidden = false;
    }
  }

  // ---------------- Load ----------------

  try {
    const response = await fetch(API_ROUTES.recruiterProfile, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok || !result.status) {
      loadingState.hidden = true;
      showAlert(result.message || "Couldn't load your recruiter profile.");
      return;
    }

    renderProfile(result.data);

    loadingState.hidden = true;
    profileLayout.hidden = false;
  } catch (err) {
    loadingState.hidden = true;
    showAlert("Couldn't reach the server. Check your connection and try again.");
  }
});