// ============================================
// CONTACT PAGE - Form submission
// ============================================

function sendMessage() {
  const name = document.getElementById("f-name").value.trim();
  const email = document.getElementById("f-email").value.trim();
  const subject = document.getElementById("f-subject").value.trim();
  const message = document.getElementById("f-message").value.trim();

  if (!name || !email || !subject || !message) {
    alert("Please fill in all fields before sending.");
    return;
  }
  if (!email.includes("@") || !email.includes(".")) {
    alert("Please enter a valid email address.");
    return;
  }

  const successEl = document.getElementById("success-msg");
  successEl.style.display = "block";
  setTimeout(() => successEl.classList.add("visible"), 20);

  document.getElementById("f-name").value = "";
  document.getElementById("f-email").value = "";
  document.getElementById("f-subject").value = "";
  document.getElementById("f-message").value = "";

  setTimeout(() => {
    successEl.classList.remove("visible");
    setTimeout(() => (successEl.style.display = "none"), 400);
  }, 5000);
}

const sendBtn = document.getElementById("send-message-btn");
if (sendBtn) {
  sendBtn.addEventListener("click", sendMessage);
}
