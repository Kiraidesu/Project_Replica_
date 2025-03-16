document.addEventListener("DOMContentLoaded", async function () {
    const token = localStorage.getItem("token");

    if (!token) {
        window.location.href = "/signin"; // Redirect if not logged in
        return;
    }

    // Fetch current user details and pre-fill form
    async function loadUserProfile() {
        try {
            const response = await fetch("/users/profile", {
                headers: { "Authorization": `Bearer ${token}` },
            });

            const data = await response.json();
            if (response.ok) {
                document.getElementById("email").value = data.email;
                document.getElementById("username").value = data.username;
                document.getElementById("address").value = data.address || "";
            } else {
                alert(data.error || "Failed to load profile.");
            }
        } catch (error) {
            console.error("Error loading profile:", error);
        }
    }

    document.getElementById("editProfileForm").addEventListener("submit", async function (event) {
        event.preventDefault();

        const updatedUsername = document.getElementById("username").value;
        const updatedAddress = document.getElementById("address").value;

        try {
            const response = await fetch("/users/update", {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username: updatedUsername, address: updatedAddress }),
            });

            const result = await response.json();
            if (response.ok) {
                alert("Profile updated successfully!");
                window.location.href = "/profile"; // Redirect back to profile page
            } else {
                alert(result.error || "Failed to update profile.");
            }
        } catch (error) {
            console.error("Error updating profile:", error);
        }
    });

    document.getElementById("cancelEdit").addEventListener("click", function () {
        window.location.href = "/profile"; // Cancel and go back
    });

    loadUserProfile();
});
