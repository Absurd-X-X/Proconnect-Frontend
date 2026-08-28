const SIDEBAR_NAV_ITEMS = [
  { page: "dashboard", href: "feed.html", icon: "ti-home", label: "Home" },
  { page: "network", href: "network-overview.html", icon: "ti-users", label: "My Network" },
  { page: "jobs", href: "#", icon: "ti-briefcase", label: "Jobs" },
  { page: "messages", href: "messages.html", icon: "ti-message-2", label: "Messages" },
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

// The row of icon shortcuts that sits in the topbar itself (Home / Network /
// Jobs / Messages / Notifications), separate from the left sidebar's own
// nav links — matches the mockups' redundant top-nav + sidebar layout.
// Rendered into a page's <div id="topbar-nav-icons"></div> mount point, if
// the page includes one. Pages that don't include the mount point simply
// don't get this row — nothing breaks.
const TOPBAR_NAV_ICON_ITEMS = [
  { page: "dashboard", href: "feed.html", icon: "ti-home", label: "Home" },
  { page: "network", href: "network-overview.html", icon: "ti-users", label: "My Network" },
  { page: "jobs", href: "#", icon: "ti-briefcase", label: "Jobs" },
  { page: "messages", href: "messages.html", icon: "ti-message-2", label: "Messages", badgeKey: "messages" },
  { page: "notifications", href: "#", icon: "ti-bell", label: "Notifications", badgeKey: "notifications" },
];

const SIDEBAR_COLLAPSE_STORAGE_KEY = "pc_sidebar_collapsed";

function currentActivePage() {
  return document.body.dataset.page || "";
}

function isSidebarCollapsed() {
  return localStorage.getItem(SIDEBAR_COLLAPSE_STORAGE_KEY) === "true";
}

function applySidebarCollapsedState(collapsed) {
  document.body.classList.toggle("sidebar-collapsed", collapsed);

  const toggleBtn = document.getElementById("sidebar-collapse-toggle");
  if (toggleBtn) {
    const icon = toggleBtn.querySelector("i");
    icon.className = collapsed ? "ti ti-chevrons-right" : "ti ti-chevrons-left";
    toggleBtn.title = collapsed ? "Expand sidebar" : "Collapse sidebar";
  }
}

function renderSidebar() {
  const root = document.getElementById("sidebar-root");
  if (!root) return; // page didn't include a mount point — nothing to do

  const activePage = currentActivePage();
  const username = localStorage.getItem("pc_username") || "User";
  const avatarUrl = localStorage.getItem("pc_avatar_url") || "";

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
          <span class="sidebar-link sidebar-link--group${isGroupActive ? " is-active" : ""}" title="${item.label}">
            <i class="ti ${item.icon}" aria-hidden="true"></i> <span class="sidebar-link__text">${item.label}</span>
            <i class="ti ti-chevron-down sidebar-group__chevron" aria-hidden="true"></i>
          </span>
          <div class="sidebar-subnav">${childrenHtml}</div>
        </div>
      `;
    }

    return `
      <a href="${item.href}" class="sidebar-link${item.page === activePage ? " is-active" : ""}" title="${item.label}">
        <i class="ti ${item.icon}" aria-hidden="true"></i> <span class="sidebar-link__text">${item.label}</span>
      </a>
    `;
  }).join("");

  const collapsed = isSidebarCollapsed();

  root.innerHTML = `
    <aside class="sidebar">
      <div class="sidebar-brand">
        <span class="auth-brand__mark"><i class="ti ti-affiliate" aria-hidden="true"></i></span>
        <span class="auth-brand__name">Pro<span class="accent">Connect</span></span>
      </div>

      <nav class="sidebar-nav">${navHtml}</nav>

      <div class="sidebar-bottom">
        <a href="#" class="sidebar-link" title="Settings"><i class="ti ti-settings" aria-hidden="true"></i> <span class="sidebar-link__text">Settings</span></a>
        <a href="#" class="sidebar-link" title="Help & Support"><i class="ti ti-help-circle" aria-hidden="true"></i> <span class="sidebar-link__text">Help &amp; Support</span></a>

        <div class="sidebar-user-wrap">
          <button type="button" class="sidebar-user" id="sidebar-user-toggle">
            ${avatarUrl
              ? `<img id="sidebar-avatar" src="${avatarUrl}" alt="" class="sidebar-user__avatar" />`
              : `<span id="sidebar-avatar" class="sidebar-user__avatar sidebar-user__avatar--fallback">${username.charAt(0).toUpperCase()}</span>`}
            <div class="sidebar-user__info">
              <div class="sidebar-user__name" id="sidebar-user-name">${username}</div>
              <div class="sidebar-user__link">View profile</div>
            </div>
            <i class="ti ti-chevron-up sidebar-user__chevron" aria-hidden="true"></i>
          </button>

          <div class="sidebar-user-dropdown" id="sidebar-user-dropdown">
            <a href="profile-overview.html" class="dropdown-menu__item"><i class="ti ti-user" aria-hidden="true"></i> View Profile</a>
            <a href="#" class="dropdown-menu__item"><i class="ti ti-settings" aria-hidden="true"></i> Settings</a>
            <button type="button" class="dropdown-menu__item dropdown-menu__item--danger" id="sidebar-user-logout"><i class="ti ti-logout" aria-hidden="true"></i> Log out</button>
          </div>
        </div>

        <a href="#" class="sidebar-link" id="sidebar-logout" title="Log out"><i class="ti ti-logout" aria-hidden="true"></i> <span class="sidebar-link__text">Log out</span></a>

        <button type="button" class="sidebar-collapse-toggle" id="sidebar-collapse-toggle" title="${collapsed ? "Expand sidebar" : "Collapse sidebar"}">
          <i class="ti ${collapsed ? "ti-chevrons-right" : "ti-chevrons-left"}" aria-hidden="true"></i>
        </button>
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

  // Logout: clear everything login.js stored, then leave. Shared by both
  // the standalone "Log out" sidebar link and the dropdown's Log out item.
  function performLogout() {
    ["pc_token", "pc_user_id", "pc_profile_id", "pc_role", "pc_username", "pc_avatar_url"].forEach((key) => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
    window.location.href = "login.html";
  }

  const logoutLink = document.getElementById("sidebar-logout");
  if (logoutLink) {
    logoutLink.addEventListener("click", (e) => {
      e.preventDefault();
      performLogout();
    });
  }

  // Sidebar user dropdown — opens upward since it sits near the bottom of
  // the screen, mirroring the topbar's user dropdown behavior.
  const sidebarUserToggle = document.getElementById("sidebar-user-toggle");
  const sidebarUserDropdown = document.getElementById("sidebar-user-dropdown");
  if (sidebarUserToggle && sidebarUserDropdown) {
    sidebarUserToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      sidebarUserDropdown.classList.toggle("is-open");
      sidebarUserToggle.classList.toggle("is-open");
    });
    document.addEventListener("click", () => {
      sidebarUserDropdown.classList.remove("is-open");
      sidebarUserToggle.classList.remove("is-open");
    });
  }

  const sidebarUserLogout = document.getElementById("sidebar-user-logout");
  if (sidebarUserLogout) {
    sidebarUserLogout.addEventListener("click", performLogout);
  }

  // Collapse/expand toggle — persists the preference so it stays collapsed
  // or expanded as the person navigates between pages, not just on this one.
  document.getElementById("sidebar-collapse-toggle").addEventListener("click", () => {
    const nowCollapsed = !isSidebarCollapsed();
    localStorage.setItem(SIDEBAR_COLLAPSE_STORAGE_KEY, nowCollapsed ? "true" : "false");
    applySidebarCollapsedState(nowCollapsed);
  });

  applySidebarCollapsedState(collapsed);
}

function renderTopbarNavIcons() {
  const mount = document.getElementById("topbar-nav-icons");
  if (!mount) return; // page didn't include a mount point — nothing to do

  const activePage = currentActivePage();

  mount.innerHTML = TOPBAR_NAV_ICON_ITEMS.map((item) => `
    <a href="${item.href}" class="topbar-nav-icon${item.page === activePage ? " is-active" : ""}" title="${item.label}">
      <i class="ti ${item.icon}" aria-hidden="true"></i>
      ${item.badgeKey ? `<span class="topbar-nav-icon__badge" data-badge-key="${item.badgeKey}" hidden></span>` : ""}
    </a>
  `).join("");
}

// Fills in the topbar's user name/avatar and wires its dropdown + logout
// button, on any page that has the standard topbar-user markup
// (#topbar-name, #topbar-avatar, #topbar-user-toggle, #topbar-dropdown,
// #topbar-logout). Centralized here instead of duplicated in every page's
// own script, since every page's topbar uses the exact same static markup
// and the same localStorage-derived data. If a page doesn't have this
// markup, each lookup below just returns null and is skipped — nothing
// breaks.
function renderTopbarUserInfo() {
  const username = localStorage.getItem("pc_username") || "User";
  const avatarUrl = localStorage.getItem("pc_avatar_url") || "";

  const nameEl = document.getElementById("topbar-name");
  if (nameEl) nameEl.textContent = username;

  const avatarImg = document.getElementById("topbar-avatar");
  if (avatarImg) {
    if (avatarUrl) {
      avatarImg.src = avatarUrl;
      avatarImg.hidden = false;
      const existingFallback = avatarImg.parentElement.querySelector(".topbar-avatar-fallback");
      if (existingFallback) existingFallback.hidden = true;
    } else {
      avatarImg.hidden = true;
      let fallback = avatarImg.parentElement.querySelector(".topbar-avatar-fallback");
      if (!fallback) {
        fallback = document.createElement("span");
        fallback.className = "topbar-avatar-fallback";
        avatarImg.insertAdjacentElement("afterend", fallback);
      }
      fallback.textContent = username.charAt(0).toUpperCase();
      fallback.hidden = false;
    }
  }

  const toggle = document.getElementById("topbar-user-toggle");
  const dropdown = document.getElementById("topbar-dropdown");
  if (toggle && dropdown && !toggle.dataset.wiredBySidebarJs) {
    toggle.dataset.wiredBySidebarJs = "true";
    toggle.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdown.classList.toggle("is-open");
    });
    document.addEventListener("click", () => dropdown.classList.remove("is-open"));
  }

  const logoutBtn = document.getElementById("topbar-logout");
  if (logoutBtn && !logoutBtn.dataset.wiredBySidebarJs) {
    logoutBtn.dataset.wiredBySidebarJs = "true";
    logoutBtn.addEventListener("click", () => {
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = "login.html";
    });
  }
}

// Sidebar/topbar badge counts (unread messages, notifications, etc.) are
// real data, not hardcoded — pages can call window.ProConnectShell
// .setBadgeCounts({...}) once they've fetched the relevant counts, or
// leave them unset to show nothing. Updates both the left-sidebar link's
// badge (if that nav item has one) and the topbar icon row's badge (found
// via data-badge-key), whichever mount points actually exist on the page.
function setBadgeCounts(counts) {
  Object.entries(counts).forEach(([key, value]) => {
    const topbarBadge = document.querySelector(`#topbar-nav-icons [data-badge-key="${key}"]`);
    if (topbarBadge) {
      topbarBadge.textContent = value;
      topbarBadge.hidden = !value;
    }
  });
}

// Apply the collapsed state to <body> immediately, before the rest of the
// page paints — avoids a visible "flash" of the expanded sidebar snapping
// shut a moment after load.
if (isSidebarCollapsed()) {
  document.body.classList.add("sidebar-collapsed");
}

document.addEventListener("DOMContentLoaded", () => {
  renderSidebar();
  renderTopbarNavIcons();
  renderTopbarUserInfo();
});

window.ProConnectShell = { setBadgeCounts };