document.addEventListener("DOMContentLoaded", function () {
    const signupForm = document.getElementById("signupForm");

    signupForm.addEventListener("submit", async function (event) {
        event.preventDefault(); // Prevent page refresh

        const username = document.getElementById("username").value;
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        const signupData = { username, email, password, role: "user" }; // Default role: user

        try {
            const response = await fetch("/users/signup", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(signupData),
            });

            const data = await response.json();

            if (response.ok) {
                alert("Signup successful! Redirecting to Sign In...");
                window.location.href = "/signin"; // Redirect to login page
            } else {
                alert(data.error || "Signup failed. Please try again.");
            }
        } catch (error) {
            console.error("Error signing up:", error);
            alert("Something went wrong. Please try again later.");
        }
    });
});
