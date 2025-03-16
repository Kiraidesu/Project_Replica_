document.addEventListener("DOMContentLoaded", async function () {
    const token = localStorage.getItem("token");

    if (!token) {
        window.location.href = "/signin"; // Redirect if not logged in
        return;
    }

    async function fetchUserProfile() {
        try {
            const response = await fetch("/users/profile", {
                headers: { "Authorization": `Bearer ${token}` },
            });
            const data = await response.json();

            if (response.ok) {
                document.getElementById("username").textContent = data.username;
                document.getElementById("email").textContent = data.email;
                document.getElementById("address").textContent = data.address || "No Address Provided";
                if (data.profilePic) {
                    document.getElementById("profilePic").src = data.profilePic;
                }
            } else {
                console.error("Failed to fetch profile:", data.error);
            }
        } catch (error) {
            console.error("Error fetching profile:", error);
        }
    }

    async function fetchCartItems() {
        try {
            const response = await fetch("/cart", {
                headers: { "Authorization": `Bearer ${token}` },
            });
            const data = await response.json();

            if (response.ok) {
                const cartContainer = document.getElementById("cartItems");
                cartContainer.innerHTML = "";
                if (data.cart.length === 0) {
                    cartContainer.innerHTML = "<p>Your cart is empty.</p>";
                } else {
                    data.cart.forEach(item => {
                        const itemElement = document.createElement("div");
                        itemElement.classList.add("cart-item");
                        itemElement.innerHTML = `
                            <p><strong>${item.name}</strong> - ₹${item.price} (x${item.quantity})</p>
                        `;
                        cartContainer.appendChild(itemElement);
                    });
                }
            }
        } catch (error) {
            console.error("Error fetching cart:", error);
        }
    }

    async function fetchOrders(type) {
    try {
        const response = await fetch("/orders", {
            headers: { "Authorization": `Bearer ${token}` },
        });
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Failed to fetch orders");
        }

        const orderContainer = document.getElementById("orderContent");
        orderContainer.innerHTML = "";

        if (!data.orders || data.orders.length === 0) {
            orderContainer.innerHTML = "<p>No orders found.</p>";
            return;
        }

        data.orders.forEach(order => {
            const orderElement = document.createElement("div");
            orderElement.classList.add("order-item");
            orderElement.innerHTML = `
                <p><strong>Order ID:</strong> ${order.id}</p>
                <p><strong>Total:</strong> ₹${order.total_price}</p>
                <p><strong>Status:</strong> ${order.status}</p>
                ${type === "track" ? `<p><strong>Estimated Delivery:</strong> 3-5 days</p>` : ""}
            `;
            orderContainer.appendChild(orderElement);
        });
    } catch (error) {
        console.error("Error fetching orders:", error);
    }
}


    // Toggle between Purchase History and Track Order
    document.getElementById("toggleHistory").addEventListener("click", () => fetchOrders("history"));
    document.getElementById("toggleTrack").addEventListener("click", () => fetchOrders("track"));

    // Fetch all user data
    fetchUserProfile();
    fetchCartItems();
	
	
	
});
