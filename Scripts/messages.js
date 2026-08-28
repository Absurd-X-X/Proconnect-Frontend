document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("pc_token") || sessionStorage.getItem("pc_token");

  if (!token) {
    window.location.href = "login.html";
    return;
  }

  const authHeaders = { Authorization: `Bearer ${token}` };
  const myUserId = localStorage.getItem("pc_user_id") || "";
  const username = localStorage.getItem("pc_username") || "You";

  let activeConversationId = null;
  let allConversations = [];
  let oldestLoadedMessagePage = 1;
  const MESSAGES_PAGE_SIZE = 30;

  // ---------------- Helpers ----------------

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str || "";
    return div.innerHTML;
  }

  function initials(firstName, lastName) {
    const a = (firstName || "").charAt(0);
    const b = (lastName || "").charAt(0);
    return (a + b).toUpperCase() || "?";
  }

  function avatarHtml(url, firstName, lastName, cssClass) {
    if (url) {
      return `<img class="${cssClass}" src="${escapeHtml(url)}" alt="" />`;
    }
    return `<span class="${cssClass}">${initials(firstName, lastName)}</span>`;
  }

  function timeAgo(dateString) {
    const then = new Date(dateString).getTime();
    if (Number.isNaN(then)) return "";
    const diffMs = Date.now() - then;
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return "now";
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d`;
    return new Date(dateString).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  function formatClockTime(dateString) {
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }

  function showToast(message, type = "info") {
    const stack = document.getElementById("toast-stack");
    if (!stack) return;
    const icon = type === "success" ? "ti-circle-check" : type === "error" ? "ti-alert-circle" : "ti-info-circle";
    const toast = document.createElement("div");
    toast.className = `toast toast--${type}`;
    toast.innerHTML = `<i class="ti ${icon}" aria-hidden="true"></i><span>${escapeHtml(message)}</span>`;
    stack.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
  }

  function extractErrorMessage(result) {
    if (result?.message) return result.message;
    if (result?.errors && typeof result.errors === "object") {
      const messages = Object.values(result.errors).flat();
      if (messages.length > 0) return messages.join(" ");
    }
    return "Something went wrong. Please try again.";
  }

  async function apiGet(url) {
    const response = await fetch(url, { method: "GET", headers: authHeaders });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || result.status === false) throw new Error(extractErrorMessage(result));
    return result.data;
  }

  async function apiPost(url, body, isForm) {
    const headers = isForm ? authHeaders : { ...authHeaders, "Content-Type": "application/json" };
    const response = await fetch(url, { method: "POST", headers, body });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || result.status === false) throw new Error(extractErrorMessage(result));
    return result;
  }

  // Topbar name/avatar/dropdown/logout are now handled centrally by
  // sidebar.js's renderTopbarUserInfo() — no per-page duplicate needed here.

  // ---------------- Conversation list ----------------

  async function loadConversations() {
    const listEl = document.getElementById("conversation-list");
    const pinnedSection = document.getElementById("pinned-section");
    const pinnedList = document.getElementById("pinned-list");
    const emptyNote = document.getElementById("conversations-empty");

    try {
      const page = await apiGet(`${API_ROUTES.getMyConversations}?pageNumber=1&pageSize=50&usePaging=true`);
      allConversations = page?.items || [];

      if (allConversations.length === 0) {
        listEl.innerHTML = "";
        pinnedSection.hidden = true;
        emptyNote.hidden = false;
        return;
      }

      emptyNote.hidden = true;

      const pinned = allConversations.filter((c) => c.isPinned);
      const rest = allConversations.filter((c) => !c.isPinned);

      if (pinned.length > 0) {
        pinnedSection.hidden = false;
        pinnedList.innerHTML = pinned.map(renderConversationRow).join("");
      } else {
        pinnedSection.hidden = true;
      }

      listEl.innerHTML = rest.map(renderConversationRow).join("");
      wireConversationRows();

      const totalUnread = allConversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
      if (window.ProConnectShell) {
        window.ProConnectShell.setBadgeCounts({ messages: totalUnread });
      }
    } catch (err) {
      listEl.innerHTML = "";
      showToast(err.message, "error");
    }
  }

  function renderConversationRow(c) {
    const hasUnread = c.unreadCount > 0;
    return `
      <div class="conversation-row${hasUnread ? " has-unread" : ""}${c.id === activeConversationId ? " is-active" : ""}" data-conversation-id="${c.id}">
        <div class="conversation-row__avatar-wrap">
          ${avatarHtml(c.photoUrl, c.title, "", "conversation-row__avatar")}
          <span class="conversation-row__presence-dot"></span>
        </div>
        <div class="conversation-row__body">
          <div class="conversation-row__top">
            <p class="conversation-row__name">
              ${c.isMuted ? '<i class="ti ti-bell-off conversation-row__mute-icon" aria-hidden="true"></i> ' : ""}
              ${escapeHtml(c.title || "Conversation")}
            </p>
            <span class="conversation-row__time">${timeAgo(c.lastActivityAt)}</span>
          </div>
          <p class="conversation-row__preview">
            ${c.lastMessageSenderFirstName === username ? "You: " : ""}${escapeHtml(c.lastMessagePreview || "No messages yet")}
          </p>
        </div>
        ${c.isPinned ? '<i class="ti ti-pin-filled conversation-row__pin-icon" aria-hidden="true"></i>' : ""}
        ${hasUnread ? `<span class="conversation-row__badge">${c.unreadCount}</span>` : ""}
      </div>`;
  }

  function wireConversationRows() {
    document.querySelectorAll(".conversation-row").forEach((row) => {
      row.addEventListener("click", () => openConversation(row.dataset.conversationId));
    });
  }

  document.getElementById("conversation-search-input").addEventListener("input", (e) => {
    const query = e.target.value.trim().toLowerCase();
    const filtered = query
      ? allConversations.filter((c) => (c.title || "").toLowerCase().includes(query))
      : allConversations;

    const pinned = filtered.filter((c) => c.isPinned);
    const rest = filtered.filter((c) => !c.isPinned);

    document.getElementById("pinned-list").innerHTML = pinned.map(renderConversationRow).join("");
    document.getElementById("pinned-section").hidden = pinned.length === 0;
    document.getElementById("conversation-list").innerHTML = rest.map(renderConversationRow).join("");
    wireConversationRows();
  });

  // ---------------- Open a conversation ----------------

  async function openConversation(conversationId) {
    activeConversationId = conversationId;

    document.getElementById("chat-empty-state").hidden = true;
    document.getElementById("chat-thread").hidden = false;
    document.querySelectorAll(".conversation-row").forEach((r) => {
      r.classList.toggle("is-active", r.dataset.conversationId === conversationId);
    });

    const conversation = allConversations.find((c) => c.id === conversationId);
    if (conversation) {
      renderChatHeader(conversation);
    }

    oldestLoadedMessagePage = 1;
    document.getElementById("chat-messages").innerHTML = '<p class="app-loading-inline">Loading messages...</p>';
    await loadMessages(conversationId, 1, true);

    try {
      await apiPost(`${API_ROUTES.markConversationRead}?conversationId=${conversationId}`);
      if (conversation) conversation.unreadCount = 0;
      const row = document.querySelector(`.conversation-row[data-conversation-id="${conversationId}"]`);
      if (row) row.classList.remove("has-unread");
      loadConversations();
    } catch {
      // Non-critical — read state will just stay unset until a future open.
    }
  }

  function renderChatHeader(c) {
    document.getElementById("chat-header-avatar").innerHTML = avatarHtml(c.photoUrl, c.title, "", "");
    document.getElementById("chat-header-name").textContent = c.title || "Conversation";

    // Online status is a real-time-only signal that needs a live connection
    // (SignalR) to know accurately — until that's wired in, this stays
    // blank rather than showing a fake status.
    document.getElementById("chat-header-status").textContent = "";

    const pinBtn = document.querySelector('[data-action="pin"]');
    const unpinBtn = document.querySelector('[data-action="unpin"]');
    const muteBtn = document.querySelector('[data-action="mute"]');
    const unmuteBtn = document.querySelector('[data-action="unmute"]');

    pinBtn.hidden = !!c.isPinned;
    unpinBtn.hidden = !c.isPinned;
    muteBtn.hidden = !!c.isMuted;
    unmuteBtn.hidden = !c.isMuted;
  }

  // ---------------- Messages ----------------

  async function loadMessages(conversationId, pageNumber, replaceAll) {
    const container = document.getElementById("chat-messages");
    const loadOlderBtn = document.getElementById("btn-load-older");

    try {
      const page = await apiGet(
        `${API_ROUTES.getConversationMessages}?conversationId=${conversationId}&pageNumber=${pageNumber}&pageSize=${MESSAGES_PAGE_SIZE}&usePaging=true`
      );
      const items = (page?.items || []).slice().reverse(); // API returns newest-first; display oldest-first

      const html = items.map(renderMessageBubble).join("");

      if (replaceAll) {
        container.innerHTML = html || '<p class="app-loading-inline">No messages yet. Say hello!</p>';
        container.appendChild(loadOlderBtn);
        container.scrollTop = container.scrollHeight;
      } else {
        const scrollHeightBefore = container.scrollHeight;
        loadOlderBtn.insertAdjacentHTML("afterend", html);
        container.scrollTop = container.scrollHeight - scrollHeightBefore;
      }

      loadOlderBtn.hidden = items.length < MESSAGES_PAGE_SIZE;
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  function renderMessageBubble(m) {
    const isOwn = m.senderId === myUserId;

    const attachmentsHtml = (m.attachmentUrls || [])
      .map((url) => {
        const isImage = /\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(url);
        return isImage
          ? `<img src="${escapeHtml(url)}" alt="" onclick="window.open('${escapeHtml(url)}', '_blank')" />`
          : `<a class="file-chip" href="${escapeHtml(url)}" target="_blank"><i class="ti ti-file" aria-hidden="true"></i> File</a>`;
      })
      .join("");

    return `
      <div class="message-bubble-row${isOwn ? " is-own" : ""}">
        ${!isOwn ? avatarHtml(m.senderProfilePictureUrl, m.senderFirstName, m.senderLastName, "message-bubble-row__avatar") : ""}
        <div>
          <div class="message-bubble">
            ${m.content ? escapeHtml(m.content) : ""}
            ${attachmentsHtml ? `<div class="message-bubble__attachments">${attachmentsHtml}</div>` : ""}
          </div>
          <div class="message-meta">${formatClockTime(m.dateCreated)}</div>
        </div>
      </div>`;
  }

  document.getElementById("btn-load-older").addEventListener("click", (e) => {
    if (!activeConversationId) return;
    const btn = e.currentTarget;
    btn.disabled = true;
    btn.textContent = "Loading...";
    oldestLoadedMessagePage += 1;
    loadMessages(activeConversationId, oldestLoadedMessagePage, false).finally(() => {
      btn.disabled = false;
      btn.textContent = "Load older messages";
    });
  });

  // ---------------- Composer ----------------

  const composerTextarea = document.getElementById("composer-textarea");
  const composerSendBtn = document.getElementById("composer-send-btn");
  const composerFileInput = document.getElementById("composer-file-input");
  const composerFilePreview = document.getElementById("composer-attachment-preview");

  let selectedFiles = [];

  function updateSendButtonState() {
    composerSendBtn.disabled = !(composerTextarea.value.trim().length > 0 || selectedFiles.length > 0);
  }

  composerTextarea.addEventListener("input", () => {
    updateSendButtonState();
    composerTextarea.style.height = "auto";
    composerTextarea.style.height = `${Math.min(composerTextarea.scrollHeight, 120)}px`;
  });

  composerTextarea.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!composerSendBtn.disabled) sendMessage();
    }
  });

  document.getElementById("composer-attach-btn").addEventListener("click", () => composerFileInput.click());

  composerFileInput.addEventListener("change", () => {
    selectedFiles = selectedFiles.concat(Array.from(composerFileInput.files));
    renderFilePreview();
    updateSendButtonState();
    composerFileInput.value = "";
  });

  function renderFilePreview() {
    composerFilePreview.innerHTML = selectedFiles
      .map(
        (f, i) => `
      <span class="composer-file-chip">
        <i class="ti ${f.type.startsWith("image") ? "ti-photo" : "ti-file"}" aria-hidden="true"></i>
        ${escapeHtml(f.name)}
        <button type="button" data-remove-index="${i}"><i class="ti ti-x" aria-hidden="true"></i></button>
      </span>`
      )
      .join("");

    composerFilePreview.querySelectorAll("[data-remove-index]").forEach((btn) => {
      btn.addEventListener("click", () => {
        selectedFiles.splice(Number(btn.dataset.removeIndex), 1);
        renderFilePreview();
        updateSendButtonState();
      });
    });
  }

  composerSendBtn.addEventListener("click", sendMessage);

  async function sendMessage() {
    if (!activeConversationId) return;

    composerSendBtn.disabled = true;

    try {
      const formData = new FormData();
      formData.append("ConversationId", activeConversationId);
      formData.append("Content", composerTextarea.value.trim());
      selectedFiles.forEach((f) => formData.append("Attachments", f));

      await apiPost(API_ROUTES.sendMessage, formData, true);

      composerTextarea.value = "";
      composerTextarea.style.height = "auto";
      selectedFiles = [];
      renderFilePreview();

      await loadMessages(activeConversationId, 1, true);
      loadConversations();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      updateSendButtonState();
    }
  }

  // ---------------- Chat menu: pin / mute / hide / leave ----------------

  document.getElementById("chat-menu-btn").addEventListener("click", (e) => {
    e.stopPropagation();
    document.getElementById("chat-menu").classList.toggle("is-open");
  });
  document.addEventListener("click", () => document.getElementById("chat-menu").classList.remove("is-open"));

  document.querySelectorAll(".chat-menu__item").forEach((btn) => {
    btn.addEventListener("click", () => handleChatMenuAction(btn.dataset.action));
  });

  async function handleChatMenuAction(action) {
    document.getElementById("chat-menu").classList.remove("is-open");
    if (!activeConversationId) return;

    const routeMap = {
      pin: API_ROUTES.pinConversation,
      unpin: API_ROUTES.unpinConversation,
      mute: API_ROUTES.muteConversation,
      unmute: API_ROUTES.unmuteConversation,
      hide: API_ROUTES.hideConversation,
      leave: API_ROUTES.leaveConversation,
    };

    const route = routeMap[action];
    if (!route) return;

    try {
      const result = await apiPost(`${route}?conversationId=${activeConversationId}`);
      showToast(result.message || "Done", "success");

      if (action === "hide" || action === "leave") {
        document.getElementById("chat-thread").hidden = true;
        document.getElementById("chat-empty-state").hidden = false;
        activeConversationId = null;
      }

      loadConversations();
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  // ---------------- Call buttons (not built yet) ----------------

  document.querySelectorAll('[data-action="call-video"], [data-action="call-voice"]').forEach((btn) => {
    btn.addEventListener("click", () => showToast("Calling isn't available yet — coming in a future update.", "info"));
  });

  // ---------------- New conversation / group modal ----------------

  const modal = document.getElementById("new-conversation-modal");
  let myConnectionsCache = null;

  function openModal() {
    modal.hidden = false;
    if (!myConnectionsCache) loadConnectionsForModal();
  }

  function closeModal() {
    modal.hidden = true;
  }

  document.getElementById("btn-new-conversation").addEventListener("click", openModal);
  document.getElementById("btn-new-conversation-empty").addEventListener("click", openModal);
  document.getElementById("close-new-conversation-modal").addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  document.querySelectorAll(".modal-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".modal-tab").forEach((t) => t.classList.remove("is-active"));
      tab.classList.add("is-active");
      const target = tab.dataset.modalTab;
      document.getElementById("modal-panel-direct").hidden = target !== "direct";
      document.getElementById("modal-panel-group").hidden = target !== "group";
    });
  });

  async function loadConnectionsForModal() {
    const directList = document.getElementById("direct-connection-list");
    const groupList = document.getElementById("group-connection-list");

    try {
      const page = await apiGet(`${API_ROUTES.getMyConnections}?pageNumber=1&pageSize=200&usePaging=true`);
      myConnectionsCache = page?.items || [];

      if (myConnectionsCache.length === 0) {
        const msg = '<p class="app-loading-inline">You need connections before you can message someone. Visit Discover People first.</p>';
        directList.innerHTML = msg;
        groupList.innerHTML = msg;
        return;
      }

      renderDirectList(myConnectionsCache);
      renderGroupList(myConnectionsCache);
    } catch (err) {
      directList.innerHTML = "";
      groupList.innerHTML = "";
      showToast(err.message, "error");
    }
  }

  function renderDirectList(connections) {
    const list = document.getElementById("direct-connection-list");
    list.innerHTML = connections
      .map(
        (c) => `
      <div class="connection-picker-row" data-user-id="${c.userId}">
        ${avatarHtml(c.profilePictureUrl, c.firstName, c.lastName, "connection-picker-row__avatar")}
        <span class="connection-picker-row__name">${escapeHtml(c.firstName)} ${escapeHtml(c.lastName)}</span>
      </div>`
      )
      .join("");

    list.querySelectorAll(".connection-picker-row").forEach((row) => {
      row.addEventListener("click", () => handleStartDirectConversation(row.dataset.userId));
    });
  }

  async function handleStartDirectConversation(recipientId) {
    try {
      const result = await apiPost(`${API_ROUTES.startConversation}?recipientId=${recipientId}`);
      closeModal();
      await loadConversations();
      if (result?.data?.id) openConversation(result.data.id);
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  const selectedGroupUserIds = new Set();

  function renderGroupList(connections) {
    const list = document.getElementById("group-connection-list");
    list.innerHTML = connections
      .map(
        (c) => `
      <div class="connection-picker-row" data-user-id="${c.userId}">
        <div style="display:flex; align-items:center; gap:10px;">
          ${avatarHtml(c.profilePictureUrl, c.firstName, c.lastName, "connection-picker-row__avatar")}
          <span class="connection-picker-row__name">${escapeHtml(c.firstName)} ${escapeHtml(c.lastName)}</span>
        </div>
        <span class="connection-picker-row__check"><i class="ti ti-check" aria-hidden="true"></i></span>
      </div>`
      )
      .join("");

    list.querySelectorAll(".connection-picker-row").forEach((row) => {
      row.addEventListener("click", () => {
        const userId = row.dataset.userId;
        if (selectedGroupUserIds.has(userId)) {
          selectedGroupUserIds.delete(userId);
          row.classList.remove("is-selected");
        } else {
          selectedGroupUserIds.add(userId);
          row.classList.add("is-selected");
        }
      });
    });
  }

  document.getElementById("btn-create-group").addEventListener("click", async () => {
    const title = document.getElementById("group-name-input").value.trim();

    if (!title) {
      showToast("Enter a group name", "error");
      return;
    }
    if (selectedGroupUserIds.size === 0) {
      showToast("Select at least one person to add", "error");
      return;
    }

    const btn = document.getElementById("btn-create-group");
    btn.disabled = true;
    btn.textContent = "Creating...";

    try {
      const result = await apiPost(
        API_ROUTES.createGroupConversation,
        JSON.stringify({ title, participantIds: Array.from(selectedGroupUserIds) })
      );
      showToast(result.message || "Group created", "success");
      closeModal();
      document.getElementById("group-name-input").value = "";
      selectedGroupUserIds.clear();
      await loadConversations();
      if (result?.data?.id) openConversation(result.data.id);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      btn.disabled = false;
      btn.textContent = "Create group";
    }
  });

  document.getElementById("direct-search-input").addEventListener("input", (e) => {
    if (!myConnectionsCache) return;
    const query = e.target.value.trim().toLowerCase();
    const filtered = query
      ? myConnectionsCache.filter((c) => `${c.firstName} ${c.lastName}`.toLowerCase().includes(query))
      : myConnectionsCache;
    renderDirectList(filtered);
  });

  document.getElementById("group-search-input").addEventListener("input", (e) => {
    if (!myConnectionsCache) return;
    const query = e.target.value.trim().toLowerCase();
    const filtered = query
      ? myConnectionsCache.filter((c) => `${c.firstName} ${c.lastName}`.toLowerCase().includes(query))
      : myConnectionsCache;
    renderGroupList(filtered);
    // Re-apply selection state after re-render, since it's rebuilt from scratch.
    filtered.forEach((c) => {
      if (selectedGroupUserIds.has(c.userId)) {
        const row = document.querySelector(`#group-connection-list [data-user-id="${c.userId}"]`);
        if (row) row.classList.add("is-selected");
      }
    });
  });

  // ---------------- Init ----------------

  loadConversations();

  // NOTE: Typing indicator and live online-status dots are intentionally
  // static/hidden right now — both require a persistent connection
  // (SignalR) to know in real time, which isn't wired up yet. The markup
  // for both already exists (#chat-typing-indicator,
  // .conversation-row__presence-dot, #chat-header-status) so hooking in
  // real-time updates later is just a matter of calling the existing
  // render functions from the hub's event handlers instead of leaving
  // them empty/hidden.
});