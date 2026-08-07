document.addEventListener("DOMContentLoaded", async () => {
  const stateLoading = document.getElementById("state-loading");
  const stateSuccess = document.getElementById("state-success");
  const stateError = document.getElementById("state-error");
  const errorMessage = document.getElementById("error-message");

  function showState(el) {
    [stateLoading, stateSuccess, stateError].forEach((s) => (s.hidden = true));
    el.hidden = false;
  }

  const params = new URLSearchParams(window.location.search);
  const email = params.get("email");
  const token = params.get("token");

  if (!token || !email) {
    errorMessage.textContent = "This link is missing information and can't be used.";
    showState(stateError);
    return;
  }

  const requestNewLinkBtn = document.getElementById("request-new-link");
  if (requestNewLinkBtn && email) {
    requestNewLinkBtn.href = `check-email.html?email=${encodeURIComponent(email)}`;
  }

  try {
    const url = `${API_ROUTES.verifyEmail}?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`;
    const response = await fetch(url, { method: "GET" });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      errorMessage.textContent =
        result.message || "This link is invalid or has expired. Request a new one below.";
      showState(stateError);
      return;
    }

    sessionStorage.removeItem("pc_pending_email");

    const continueBtn = document.getElementById("continue-btn");
    if (continueBtn) {
      continueBtn.href = `choose-account-type.html?email=${encodeURIComponent(email)}`;
    }

    showState(stateSuccess);

  } catch (err) {
    errorMessage.textContent = "Couldn't reach the server. Check your connection and try again.";
    showState(stateError);
  }
});