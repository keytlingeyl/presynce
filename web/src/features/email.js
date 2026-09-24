(function () {
  emailjs.init("GerBcjzayEM8Zjaai"); // replace with your Emails public key
})();

// Attach event listener to the form
window.onload = function () {
  const form = document.querySelector("form");
  form.addEventListener("submit", function (event) {
    event.preventDefault(); // prevent page reload
    // Collect form data
    const templateParams = {
      name: document.getElementById("name").value,
      email: document.getElementById("email").value,
      message: document.getElementById("message").value,
    };

    // Send email using Emails
    emailjs.send("service_2ve1dpk", "template_c6ixl1r", templateParams).then(
      function (response) {
        showConfirmModal({
          title: "Success!",
          message: "Message sent successfully!",
          type: "warning",
        });
        console.log("SUCCESS!", response.status, response.text);
      },
      function (error) {
        showConfirmModal({
          title: "Failed!",
          message: error,
          type: "warning",
        });
        console.error("FAILED...", error);
      },
    );
  });
};
