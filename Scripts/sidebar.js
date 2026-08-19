const SIDEBAR_NAV_ITEMS = [
  { page: "dashboard", href: "#", icon: "ti-home", label: "Dashboard" },
  { page: "network", href: "#", icon: "ti-users", label: "My Network" },
  { page: "jobs", href: "#", icon: "ti-briefcase", label: "Jobs" },
  { page: "messages", href: "#", icon: "ti-message-2", label: "Messages" },
  { page: "saved", href: "#", icon: "ti-bookmark", label: "Saved" },
  { page: "applications", href: "#", icon: "ti-file-text", label: "Applications" },
  {
    group: "profile",
    icon: "ti-user",
    label: "Profile",
    children: [
      { page: "profile-overview", href: "profile-overview.html", label: "Overview" },
      { page: "profile-edit", href: "edit-professional-profile.html", label: "Edit Profile" },
      { page: "profile-resume", href: "resume.html", label: "Resume" },
      { page: "profile-portfolio", href: "portfolio.html", label: "Portfolio" },
      { page: "profile-availability", href: "availability.html", label: "Availability" },
    ],
  },
  { page: "analytics", href: "#", icon: "ti-chart-bar", label: "Analytics" },
  { page: "events", href: "#", icon: "ti-calendar", label: "Events" },
];

function renderSidebar() {
  const root = document.getElementById("sidebar-root");
  if (!root) return; // page didn't include a mount point — nothing to do

  const activePage = document.body.dataset.page || "";

  const navHtml = SIDEBAR_NAV_ITEMS.map((item) => {
    if (item.children) {
      const isGroupActive = item.children.some((c) => c.page === activePage);
      const childrenHtml = item.children.map((c) => `
        <a href="${c.href}" class="sidebar-sublink${c.page === activePage ? " is-active" : ""}">
          ${c.label}
        </a>
      `).join("");

      return `
        <div class="sidebar-group${isGroupActive ? " is-open" : ""}">
          <span class="sidebar-link sidebar-link--group${isGroupActive ? " is-active" : ""}">
            <i class="ti ${item.icon}" aria-hidden="true"></i> ${item.label}
            <i class="ti ti-chevron-down sidebar-group__chevron" aria-hidden="true"></i>
          </span>
          <div class="sidebar-subnav">${childrenHtml}</div>
        </div>
      `;
    }

    return `
      <a href="${item.href}" class="sidebar-link${item.page === activePage ? " is-active" : ""}">
        <i class="ti ${item.icon}" aria-hidden="true"></i> ${item.label}
      </a>
    `;
  }).join("");

  root.innerHTML = `
    <aside class="sidebar">
      <div class="sidebar-brand">
        <span class="auth-brand__mark"><i class="ti ti-affiliate" aria-hidden="true"></i></span>
        <span class="auth-brand__name">Pro<span class="accent">Connect</span></span>
      </div>

      <nav class="sidebar-nav">${navHtml}</nav>

      <div class="sidebar-bottom">
        <a href="#" class="sidebar-link"><i class="ti ti-settings" aria-hidden="true"></i> Settings</a>
        <a href="#" class="sidebar-link"><i class="ti ti-help-circle" aria-hidden="true"></i> Help &amp; Support</a>

        <div class="sidebar-user" id="sidebar-user">
          <img id="sidebar-avatar" src="" alt="" class="sidebar-user__avatar" />
          <div>
            <div class="sidebar-user__name" id="sidebar-user-name">Loading...</div>
            <div class="sidebar-user__link">View profile</div>
          </div>
        </div>

        <a href="#" class="sidebar-link" id="sidebar-logout"><i class="ti ti-logout" aria-hidden="true"></i> Log out</a>
      </div>
    </aside>
  `;

  // Manual toggle for a group that isn't currently active — clicking the
  // "Profile" label expands/collapses its sub-links without navigating.
  root.querySelectorAll(".sidebar-group").forEach((group) => {
    const header = group.querySelector(".sidebar-link--group");
    header.addEventListener("click", () => {
      group.classList.toggle("is-open");
    });
  });

  // Logout: clear everything login.js stored, then leave.
  const logoutLink = document.getElementById("sidebar-logout");
  if (logoutLink) {
    logoutLink.addEventListener("click", (e) => {
      e.preventDefault();
      ["pc_token", "pc_user_id", "pc_profile_id", "pc_role", "pc_username"].forEach((key) => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });
      window.location.href = "login.html";
    });
  }
}

// Runs on DOMContentLoaded. As long as this <script> tag is included
// BEFORE any other page script (e.g. profileOverview.js), its listener
// fires first, so the sidebar markup (and #sidebar-user-name etc.) exists
// by the time other scripts try to fill in user details.
document.addEventListener("DOMContentLoaded", renderSidebar);