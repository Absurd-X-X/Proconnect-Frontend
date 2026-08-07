document.addEventListener("DOMContentLoaded", () => {
  const professionalCard = document.getElementById("role-professional");
  const recruiterCard = document.getElementById("role-recruiter");
  const alertBox = document.getElementById("form-alert");

  const params = new URLSearchParams(window.location.search);
  const email = params.get("email") || sessionStorage.getItem("pc_pending_email");

  if (!email) {
    window.location.href = "register.html";
    return;
  }

  function showAlert(message) {
    alertBox.textContent = message;
    alertBox.hidden = false;
  }

  function hideAlert() {
    alertBox.hidden = true;
    alertBox.textContent = "";
  }

  function setCardLoading(card, isLoading) {
    card.disabled = isLoading;
    card.classList.toggle("is-selected", isLoading);
  }

  async function selectRole(card, role) {
    hideAlert();
    setCardLoading(card, true);

    try {
      const response = await fetch(API_ROUTES.setupAccount, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, accountType: role }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        showAlert(result.message || "Couldn't save your account type. Please try again.");
        setCardLoading(card, false);
        return;
      }

      const nextPage = role === "Professional"
        ? "professional-profile-setup.html"
        : "recruiter-profile-setup.html";

      window.location.href = `${nextPage}?email=${encodeURIComponent(email)}`;

    } catch (err) {
      showAlert("Couldn't reach the server. Check your connection and try again.");
      setCardLoading(card, false);
    }
  }

  professionalCard.addEventListener("click", () => selectRole(professionalCard, "Professional"));
  recruiterCard.addEventListener("click", () => selectRole(recruiterCard, "Recruiter"));
});