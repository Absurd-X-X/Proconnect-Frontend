document.addEventListener("DOMContentLoaded", async () => {
  const loadingState = document.getElementById("loading-state");
  const alertBox = document.getElementById("form-alert");
  const dashboardContent = document.getElementById("dashboard-content");

  const token = localStorage.getItem("pc_token") || sessionStorage.getItem("pc_token");
  const username = localStorage.getItem("pc_username") || "there";

  document.getElementById("welcome-message").textContent =
    `Welcome back, ${username}! Here's what's happening with your hiring.`;

  function showAlert(message) {
    alertBox.textContent = message;
    alertBox.hidden = false;
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str ?? "";
    return div.innerHTML;
  }

  // ---------------- Stat cards ----------------
  // NOTE: "Open Jobs", "New Applications", "Interviews Scheduled",
  // "Offers Extended", "Hires This Month" all come from the Jobs /
  // Applications / Interviews modules, which aren't built yet. Rendered
  // here only if the company management overview (Module 3) supplies a
  // subset — Open Jobs and Team Members are real; the rest render as
  // "—" until those modules exist, rather than showing invented numbers.

  function renderStatCards(overview) {
    const cards = [
      {
        icon: "ti-briefcase",
        color: "purple",
        value: overview ? overview.openPositionCount : "—",
        label: "Open Jobs",
      },
      {
        icon: "ti-users",
        color: "green",
        value: overview ? overview.teamMemberCount : "—",
        label: "Team Members",
      },
      {
        icon: "ti-calendar",
        color: "blue",
        value: "—",
        label: "Interviews Scheduled",
      },
      {
        icon: "ti-star",
        color: "orange",
        value: "—",
        label: "Offers Extended",
      },
      {
        icon: "ti-user-check",
        color: "purple",
        value: overview ? overview.activeCandidateCount : "—",
        label: "Active Candidates",
      },
    ];

    const iconBg = {
      purple: "var(--pc-purple-light)",
      green: "var(--pc-success-bg)",
      blue: "#E5EEFF",
      orange: "#FDEFE0",
    };
    const iconColor = {
      purple: "var(--pc-purple)",
      green: "var(--pc-success)",
      blue: "#2563EB",
      orange: "#D97706",
    };

    document.getElementById("stat-cards").innerHTML = cards
      .map(
        (c) => `
        <div class="stat-card">
          <span class="stat-card__icon" style="background:${iconBg[c.color]};color:${iconColor[c.color]};">
            <i class="ti ${c.icon}" aria-hidden="true"></i>
          </span>
          <div>
            <div class="stat-card__value">${c.value}</div>
            <div class="stat-card__label">${c.label}</div>
          </div>
        </div>`
      )
      .join("");
  }

  // ---------------- Hiring pipeline (placeholder — needs Applications module) ----------------

  function renderPipelinePlaceholder() {
    document.getElementById("pipeline-funnel").innerHTML =
      `<p class="empty-hint">Pipeline data will appear here once the Applications module is connected.</p>`;
  }

  // ---------------- Applications chart (placeholder) ----------------

  function renderChartPlaceholder() {
    document.getElementById("applications-chart").innerHTML =
      `<p class="empty-hint">Chart data will appear here once the Applications module is connected.</p>`;
    document.getElementById("chart-stats").innerHTML = "";
  }

  // ---------------- Donut chart (placeholder) ----------------

  function renderDonutPlaceholder() {
    document.getElementById("donut-chart").innerHTML = "";
    document.getElementById("donut-legend").innerHTML =
      `<li class="empty-hint">Source data will appear here once the Applications module is connected.</li>`;
  }

  // ---------------- Open jobs table (placeholder — needs Jobs module) ----------------

  function renderOpenJobsPlaceholder() {
    document.getElementById("open-jobs-table-body").innerHTML = "";
    document.getElementById("jobs-empty-hint").hidden = false;
  }

  function renderTopJobsPlaceholder() {
    document.getElementById("top-jobs-list").innerHTML =
      `<p class="empty-hint">Jobs will appear here once the Jobs module is connected.</p>`;
  }

  // ---------------- Interviews (placeholder — needs Interviews module) ----------------

  function renderInterviewsPlaceholder() {
    document.getElementById("interviews-list").innerHTML = "";
    document.getElementById("interviews-empty-hint").hidden = false;
  }

  // ---------------- Recent activity (placeholder — needs Notifications/Audit feed) ----------------

  function renderActivityPlaceholder() {
    document.getElementById("activity-list").innerHTML =
      `<p class="empty-hint">Recent activity will appear here.</p>`;
  }

  // ---------------- Load ----------------

  try {
    const response = await fetch(API_ROUTES.companyManagementOverview, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const result = await response.json().catch(() => ({}));

    const overview = response.ok && result.status ? result.data : null;

    if (!overview) {
      showAlert(
        result.message ||
          "You're not yet linked to a company. Create or join a company to see hiring stats."
      );
    }

    renderStatCards(overview);
    renderPipelinePlaceholder();
    renderChartPlaceholder();
    renderDonutPlaceholder();
    renderOpenJobsPlaceholder();
    renderTopJobsPlaceholder();
    renderInterviewsPlaceholder();
    renderActivityPlaceholder();

    if (window.ProConnectShell) {
      window.ProConnectShell.setBadgeCounts({
        applications: overview ? overview.activeCandidateCount : 0,
      });
    }

    loadingState.hidden = true;
    dashboardContent.hidden = false;
  } catch (err) {
    loadingState.hidden = true;
    showAlert("Couldn't reach the server. Check your connection and try again.");
  }
});