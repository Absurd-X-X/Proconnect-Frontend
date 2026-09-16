(function () {
  const token = localStorage.getItem("pc_token") || sessionStorage.getItem("pc_token");

  const state = {
    searchTerm: "",
    eventTypes: [],
    locationType: "",
    dateRangeDays: "",
    pageNumber: 1,
    pageSize: 6,
  };

  function showToast(message, type = "success") {
    const container = document.getElementById("toast-stack");
    const toast = document.createElement("div");
    toast.className = `toast toast--${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.classList.add("is-visible"), 10);
    setTimeout(() => {
      toast.classList.remove("is-visible");
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  async function apiRequest(url, options = {}) {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });

    const data = await response.json();

    if (!response.ok || !data.status) {
      throw new Error(data.message || "Something went wrong");
    }

    return data;
  }

  function formatDateRange(start, end) {
    const s = new Date(start);
    const e = new Date(end);
    const dateStr = s.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
    const startTime = s.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
    const endTime = e.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
    return `${dateStr} · ${startTime} – ${endTime}`;
  }

  function locationLabel(e) {
    if (e.locationType === "Online") return "Online Event";
    if (e.locationType === "Hybrid") return `${e.location || "Hybrid"} + Online`;
    return e.location || "In-person";
  }

  function eventTypeBadgeClass(type) {
    return (
      {
        Networking: "event-badge--networking",
        Webinar: "event-badge--webinar",
        Workshop: "event-badge--workshop",
        Conference: "event-badge--conference",
        CareerFair: "event-badge--careerfair",
        Social: "event-badge--social",
      }[type] || ""
    );
  }

  // ---- Featured events ----
  async function loadFeatured() {
    try {
      const result = await apiRequest(`${API_ROUTES.getFeaturedEvents}?count=3`);
      renderFeatured(result.data);
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  function renderFeatured(events) {
    const container = document.getElementById("featured-list");

    if (!events.length) {
      document.getElementById("featured-section").hidden = true;
      return;
    }

    container.innerHTML = events
      .map(
        (e) => `
      <a href="event-details.html?id=${e.id}" class="featured-card">
        <div class="featured-card__image" style="${e.coverImageUrl ? `background-image: url('${e.coverImageUrl}')` : ""}">
          <span class="event-badge ${eventTypeBadgeClass(e.eventType)}">${e.eventType}</span>
          <button type="button" class="save-btn ${e.isSaved ? "is-saved" : ""}" data-save-toggle="${e.id}" data-saved="${e.isSaved}">
            <i class="ti ${e.isSaved ? "ti-bookmark-filled" : "ti-bookmark"}" aria-hidden="true"></i>
          </button>
        </div>
        <div class="featured-card__body">
          <h3>${e.title}</h3>
          <p>${e.description}</p>
          <div class="featured-card__meta">
            <span><i class="ti ti-calendar" aria-hidden="true"></i> ${formatDateRange(e.startDateTime, e.endDateTime)}</span>
            <span><i class="ti ti-map-pin" aria-hidden="true"></i> ${locationLabel(e)}</span>
            <span><i class="ti ti-building" aria-hidden="true"></i> ${e.companyName}</span>
          </div>
          <div class="featured-card__footer">
            <span class="going-count"><i class="ti ti-users" aria-hidden="true"></i> ${e.goingCount} going</span>
            <span class="btn-primary btn-compact">Register</span>
          </div>
        </div>
      </a>
    `
      )
      .join("");

    wireSaveButtons(container);
  }

  // ---- Discover / Upcoming ----
  async function loadEvents() {
    try {
      const url = new URL(API_ROUTES.discoverEvents);
      if (state.searchTerm) url.searchParams.set("searchTerm", state.searchTerm);
      if (state.eventTypes.length) url.searchParams.set("eventTypes", state.eventTypes.join(","));
      if (state.locationType) url.searchParams.set("locationType", state.locationType);

      if (state.dateRangeDays) {
        const from = new Date();
        const to = new Date();
        to.setDate(to.getDate() + parseInt(state.dateRangeDays, 10));
        url.searchParams.set("startDateFrom", from.toISOString());
        url.searchParams.set("startDateTo", to.toISOString());
      }

      url.searchParams.set("pageNumber", state.pageNumber);
      url.searchParams.set("pageSize", state.pageSize);
      url.searchParams.set("usePaging", "true");

      const result = await apiRequest(url.toString());
      renderUpcoming(result.data.items);
      renderPagination(result.data.totalCount);
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  function renderUpcoming(items) {
    const list = document.getElementById("upcoming-list");
    const emptyState = document.getElementById("empty-state");

    if (!items.length) {
      list.innerHTML = "";
      emptyState.hidden = false;
      return;
    }

    emptyState.hidden = true;

    list.innerHTML = items
      .map(
        (e) => `
      <div class="upcoming-card">
        <a href="event-details.html?id=${e.id}" class="upcoming-card__image" style="${
          e.coverImageUrl ? `background-image: url('${e.coverImageUrl}')` : ""
        }">
          <span class="event-badge ${eventTypeBadgeClass(e.eventType)}">${e.eventType}</span>
        </a>
        <div class="upcoming-card__body">
          <a href="event-details.html?id=${e.id}"><h3>${e.title}</h3></a>
          <p>${e.description}</p>
        </div>
        <div class="upcoming-card__meta">
          <span><i class="ti ti-calendar" aria-hidden="true"></i> ${formatDateRange(e.startDateTime, e.endDateTime)}</span>
          <span><i class="ti ti-map-pin" aria-hidden="true"></i> ${locationLabel(e)}</span>
        </div>
        <div class="upcoming-card__actions">
          <a href="event-details.html?id=${e.id}" class="btn-outline btn-compact">Register</a>
          <button type="button" class="card-icon-btn ${e.isSaved ? "is-saved" : ""}" data-save-toggle="${e.id}" data-saved="${e.isSaved}">
            <i class="ti ${e.isSaved ? "ti-bookmark-filled" : "ti-bookmark"}" aria-hidden="true"></i>
          </button>
        </div>
      </div>
    `
      )
      .join("");

    wireSaveButtons(list);
  }

  function wireSaveButtons(container) {
    container.querySelectorAll("[data-save-toggle]").forEach((btn) => {
      btn.addEventListener("click", async (evt) => {
        evt.preventDefault();
        evt.stopPropagation();

        const eventId = btn.dataset.saveToggle;
        const isSaved = btn.dataset.saved === "true";

        try {
          await apiRequest(isSaved ? API_ROUTES.unsaveEvent : API_ROUTES.saveEvent, {
            method: "POST",
            body: JSON.stringify({ EventId: eventId }),
          });

          btn.dataset.saved = (!isSaved).toString();
          btn.classList.toggle("is-saved", !isSaved);
          const icon = btn.querySelector("i");
          icon.className = `ti ${!isSaved ? "ti-bookmark-filled" : "ti-bookmark"}`;

          showToast(isSaved ? "Removed from saved events" : "Event saved");
        } catch (err) {
          showToast(err.message, "error");
        }
      });
    });
  }

  function renderPagination(totalCount) {
    const pageCount = Math.ceil(totalCount / state.pageSize);
    const container = document.getElementById("pagination");

    if (pageCount <= 1) {
      container.innerHTML = "";
      return;
    }

    let html = "";
    for (let i = 1; i <= pageCount; i++) {
      html += `<button type="button" class="pagination__btn ${i === state.pageNumber ? "is-active" : ""}" data-page="${i}">${i}</button>`;
    }
    container.innerHTML = html;

    container.querySelectorAll(".pagination__btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.pageNumber = parseInt(btn.dataset.page, 10);
        loadEvents();
        window.scrollTo({ top: document.querySelector(".discover-main").offsetTop - 100, behavior: "smooth" });
      });
    });
  }

  // ---- Filters ----
  document.getElementById("apply-filters-btn").addEventListener("click", () => {
    state.eventTypes = Array.from(document.querySelectorAll('input[name="event-type"]:checked')).map((cb) => cb.value);
    state.locationType = document.querySelector('input[name="location-type"]:checked').value;
    state.dateRangeDays = document.querySelector('input[name="date-range"]:checked').value;
    state.pageNumber = 1;
    loadEvents();
  });

  document.getElementById("clear-filters-btn").addEventListener("click", () => {
    document.querySelectorAll('input[name="event-type"]').forEach((cb) => (cb.checked = false));
    document.querySelector('input[name="location-type"][value=""]').checked = true;
    document.querySelector('input[name="date-range"][value=""]').checked = true;
    state.eventTypes = [];
    state.locationType = "";
    state.dateRangeDays = "";
    state.pageNumber = 1;
    loadEvents();
  });

  document.getElementById("search-btn").addEventListener("click", () => {
    state.searchTerm = document.getElementById("search-input").value.trim();
    state.pageNumber = 1;
    loadEvents();
  });

  document.getElementById("search-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      document.getElementById("search-btn").click();
    }
  });

  loadFeatured();
  loadEvents();
})();