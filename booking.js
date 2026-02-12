function submitBooking() {
  const name = document.getElementById("name").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const service = document.getElementById("service").value;

  if (!name || !phone || !service) {
    alert("Please fill all details");
    return;
  }

  const button = document.querySelector("button[type='submit']");
  const loading = document.getElementById("loadingMsg");
  const successBox = document.getElementById("successBox");
  const successText = document.getElementById("successText");

  // UI state
  button.disabled = true;
  button.innerText = "Booking...";
  if (loading) loading.style.display = "block";
  if (successBox) successBox.style.display = "none";

  fetch("https://charvis-backend.onrender.com/booking", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, phone, service })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      successText.innerHTML = `
        Thank you <b>${name}</b><br>
        Your booking ID is <b>${data.booking_id}</b>
      `;
      if (successBox) successBox.style.display = "block";

      document.getElementById("bookingForm").reset();
    } else {
      alert("Booking failed. Try again.");
    }
  })
  .catch(() => {
    alert("Server error. Please try later.");
  })
  .finally(() => {
    button.disabled = false;
    button.innerText = "Book Now";
    if (loading) loading.style.display = "none";
  });
}
