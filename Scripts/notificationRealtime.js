// Shared real-time notification bootstrap.
// Include this on every authenticated page, AFTER config.js, sidebar.js
// (or companyLayout.js), and the SignalR CDN script.
//
// Responsibilities:
//   1. On load, fetch the current unread count via REST and push it into
//      the shared badge system (window.ProConnectShell.setBadgeCounts).
//   2. Connect to NotificationHub and keep the badge + a toast in sync
//      as new notifications arrive in real time.
//
// Mirrors the JWT-over-querystring connection pattern already used by
// messages.js for ChatHub — same HUB_BASE_URL derivation, same
// withAutomaticReconnect(), same "not a hard failure if it can't connect"
// posture (the page still works via REST/polling if SignalR is down).
(function () {
  const token = localStorage.getItem("pc_token") || sessionStorage.getItem("pc_token");
  if (!token) return; // sidebar.js / page guard already handles redirecting to login

  const HUB_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, "");
  let connection = null;

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str || "";
    return div.innerHTML;
  }

  function showNotificationToast(payload) {
    const stack = document.getElementById("toast-stack");
    if (!stack) return; // page doesn't have a toast mount point — badge update still happens

    const toast = document.createElement("div");
    toast.className = "toast toast--info toast--notification";
    toast.style.cursor = payload.actionUrl ? "pointer" : "default";
    toast.innerHTML = `
      <i class="ti ti-bell" aria-hidden="true"></i>
      <span><strong>${escapeHtml(payload.title)}</strong><br/>${escapeHtml(payload.message)}</span>
    `;

    if (payload.actionUrl) {
      toast.addEventListener("click", () => {
        window.location.href = payload.actionUrl;
      });
    }

    stack.appendChild(toast);
    setTimeout(() => toast.remove(), 6000);
  }

  async function fetchUnreadCount() {
    try {
      const response = await fetch(API_ROUTES.getUnreadNotificationCount, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json().catch(() => ({}));

      if (response.ok && result.status !== false && window.ProConnectShell) {
        window.ProConnectShell.setBadgeCounts({ notifications: result.data || 0 });
      }
    } catch {
      // Non-critical — badge just stays at its last known value.
    }
  }

  async function initNotificationsHub() {
    if (typeof signalR === "undefined") return; // SignalR script not loaded on this page

    connection = new signalR.HubConnectionBuilder()
      .withUrl(`${HUB_BASE_URL}/notificationHub?access_token=${encodeURIComponent(token)}`)
      .withAutomaticReconnect()
      .build();

    connection.on("ReceiveNotification", (payload) => {
      showNotificationToast(payload);
    });

    connection.on("UpdateUnreadCount", (count) => {
      if (window.ProConnectShell) {
        window.ProConnectShell.setBadgeCounts({ notifications: count });
      }
    });

    try {
      await connection.start();
    } catch (err) {
      console.error("Notification hub connection failed:", err);
      // Real-time badge/toast updates won't fire, but the REST-based
      // unread count fetched above still works — not a hard failure.
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    fetchUnreadCount();
    initNotificationsHub();
  });
})();