document.addEventListener("DOMContentLoaded", function () {
    fetchCart();
});

async function fetchCart() {
    const token = localStorage.getItem("token");

    if (!token) {
        alert("You must log in to view your cart.");
        window.location.href = "signin.html"; // Redirect to sign-in page
        return;
    }

    try {
        const response = await fetch("/cart", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to fetch cart");
        }

        const data = await response.json();
        console.log("Cart Data:", data);
        displayCartItems(data.cart);
    } catch (error) {
        console.error("Error loading cart:", error);
    }
}
