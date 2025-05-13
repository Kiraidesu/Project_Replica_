document.addEventListener("DOMContentLoaded", async function () {
    const token = localStorage.getItem("token");
    
    console.log("🟢 Frontend Token:", token); // ✅ Log token before sending request

    if (!token) {
        alert("Please log in to view your cart.");
        window.location.href = "/signin";
        return;
    }

    async function fetchCart() {
        try {
            console.log("📡 Sending request to /cart with token..."); // ✅ Log before request
            //console.log(token);
            const response = await fetch("/api/cart", {
                headers: { "Authorization": `Bearer ${token}` },
            });

            //console.log("🔄 Response Status:", response.status); // ✅ Log response status

            const data = await response.json();
            //console.log("📩 Response Data:", data); // ✅ Log response data

            if (response.ok) {
                displayCart(data.cart);
            } else {
                alert(data.error || "Failed to load cart.");
            }
        } catch (error) {
            //console.error("❌ Error fetching cart:", error);
        }
    }
	
	 function displayCart(cart) {
        const cartContainer = document.getElementById("cartContainer");
        cartContainer.innerHTML = "";

        if (!cart || cart.length === 0) {
            cartContainer.innerHTML = "<p>Your cart is empty.</p>";
            return;
        }

        cart.forEach(item => {
            const cartItem = document.createElement("div");
            cartItem.classList.add("cart-item");
            cartItem.innerHTML = `
                <p><strong>${item.name}</strong> - ₹${item.price} x ${item.quantity}</p>
                <button class="remove-btn btn btn-danger" data-id="${item.id}">Remove</button>
            `;
            cartContainer.appendChild(cartItem);
        });

        document.querySelectorAll(".remove-btn").forEach(button => {
            button.addEventListener("click", async function () {
                const itemId = this.dataset.id;
                await removeFromCart(itemId);
            });
        });
    }

    async function removeFromCart(id) {
        try {
            const response = await fetch(`/cart/remove/${id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` },
            });

            if (response.ok) {
                fetchCart(); // Reload cart after removal
            } else {
                alert("Failed to remove item.");
            }
        } catch (error) {
            console.error("Error removing item:", error);
        }
    }

    fetchCart();
});
