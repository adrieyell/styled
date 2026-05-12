// ============================================
// CONTACT PAGE - Form submission
// ============================================

async function sendMessage() {
  const name = document.getElementById("f-name").value.trim();
  const email = document.getElementById("f-email").value.trim();
  const subject = document.getElementById("f-subject").value.trim();
  const message = document.getElementById("f-message").value.trim();

  // Client-side validation
  if (!name || !email || !subject || !message) {
    alert("Please fill in all fields before sending.");
    return;
  }
  if (!email.includes("@") || !email.includes(".")) {
    alert("Please enter a valid email address.");
    return;
  }

  // Build form data
  const formData = new FormData();
  formData.append("name", name);
  formData.append("email", email);
  formData.append("subject", subject);
  formData.append("message", message);

  try {
    const response = await fetch("php/contact.php", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (data.success) {
      // Show green success message
      const successEl = document.getElementById("success-msg");
      successEl.style.display = "block";
      setTimeout(() => successEl.classList.add("visible"), 20);

      // Clear form fields
      document.getElementById("f-name").value = "";
      document.getElementById("f-email").value = "";
      document.getElementById("f-subject").value = "";
      document.getElementById("f-message").value = "";

      // Hide success message after 5 seconds
      setTimeout(() => {
        successEl.classList.remove("visible");
        setTimeout(() => (successEl.style.display = "none"), 400);
      }, 5000);
    } else {
      alert(data.error || "Failed to send message. Please try again.");
    }
  } catch (error) {
    alert("An error occurred. Please check your connection and try again.");
  }
}

const sendBtn = document.getElementById("send-message-btn");
if (sendBtn) {
  sendBtn.addEventListener("click", sendMessage);
}
