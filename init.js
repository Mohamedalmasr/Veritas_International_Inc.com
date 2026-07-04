(() => {
  const HOME_PAGE = "home.html";

  document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm"); // Replace with your actual form ID if different

    if (loginForm) {
      loginForm.addEventListener("submit", (e) => {
        e.preventDefault(); // Prevent default form submission behavior

        try {
          // Set authorization session to true directly without any 19 or 15 checks
          sessionStorage.setItem("ok_auth", "true");
          
          // Redirect immediately to the home page
          window.location.href = HOME_PAGE;
        } catch (error) {
          console.error("Navigation error:", error);
          // Fallback redirect in case of unexpected errors
          window.location.assign(HOME_PAGE);
        }
      });
    }
  });
})();