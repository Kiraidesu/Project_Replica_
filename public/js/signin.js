document.addEventListener("DOMContentLoaded", function () {
    const signinForm = document.getElementById("signinForm");

    signinForm.addEventListener("submit", async function (event) {
        event.preventDefault(); // Prevent page reload

        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        const loginData = { email, password };

        try {
            const response = await fetch("/users/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(loginData),
            });

            const data = await response.json();

            if (response.ok) {
                alert("Login successful! Redirecting...");
                localStorage.setItem("token", data.token); // Store token for future requests
                window.location.href = "/profile"; // Redirect to homepage
            } else {
                alert(data.error || "Login failed. Please check your credentials.");
            }
        } catch (error) {
            console.error("Error logging in:", error);
            alert("Something went wrong. Please try again later.");
        }
    });
});
