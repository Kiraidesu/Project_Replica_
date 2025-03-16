document.addEventListener("DOMContentLoaded", async function () {
    const token = localStorage.getItem("token");
    const userDropdown = document.getElementById("userDropdown");
    const userAvatar = document.getElementById("userAvatar");
    const navbarUsername = document.getElementById("navbarUsername");
    const signinNav = document.getElementById("signinNav");

    if (!userDropdown || !userAvatar || !navbarUsername || !signinNav) {
        console.warn("Navbar elements not found. Skipping navbar updates.");
        return;
    }

    if (token) {
        try {
            const response = await fetch("/users/profile", {
                headers: { "Authorization": `Bearer ${token}` },
            });
            const data = await response.json();

            if (response.ok) {
                navbarUsername.textContent = data.username;
                if (data.profilePic) {
                    userAvatar.src = data.profilePic;
                }

                // Show profile dropdown, hide Sign In
                userDropdown.classList.remove("d-none");
                signinNav.classList.add("d-none");
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
        }
    }

    // Logout Functionality
    document.getElementById("logoutBtn")?.addEventListener("click", function () {
        localStorage.removeItem("token");
        window.location.href = "/signin.html"; // Redirect to sign-in after logout
    });
});
