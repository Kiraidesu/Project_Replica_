document.addEventListener("DOMContentLoaded", async function () {
    const token = localStorage.getItem("token");
    if (!token) {
        alert("Please log in to proceed with checkout.");
        window.location.href = "/signin";
        return;
    }

    const cartContainer = document.getElementById("cartSummary");
    const checkoutForm = document.getElementById("checkoutForm");
    const orderSummary = document.getElementById("orderSummary");
    
    async function fetchCart() {
        try {
            const response = await fetch("/cart", {
                headers: { "Authorization": `Bearer ${token}` },
            });
            const data = await response.json();

            if (response.ok) {
                displayCart(data.cart);
            } else {
                alert(data.error || "Failed to load cart.");
            }
        } catch (error) {
            console.error("Error fetching cart:", error);
        }
    }

    function displayCart(cart) {
        cartContainer.innerHTML = "";
        let totalAmount = 0;

        if (cart.length === 0) {
            cartContainer.innerHTML = "<p>Your cart is empty.</p>";
            return;
        }

        cart.forEach(item => {
            totalAmount += item.price * item.quantity;
            const itemElement = document.createElement("div");
            itemElement.classList.add("cart-item");
            itemElement.innerHTML = `
                <p><strong>${item.name}</strong> - ₹${item.price} x ${item.quantity}</p>
            `;
            cartContainer.appendChild(itemElement);
        });
        
        orderSummary.innerHTML = `<h4>Total: ₹${totalAmount}</h4>`;
    }

    checkoutForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const address = document.getElementById("address").value;
        const paymentMethod = document.getElementById("paymentMethod").value;

        if (!address || !paymentMethod) {
            alert("Please fill in all required fields.");
            return;
        }

        try {
            const response = await fetch("/orders/create", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({ address, paymentMethod }),
            });

            const data = await response.json();

            if (response.ok) {
                alert("Order placed successfully!");
                window.location.href = "/profile"; // Redirect to profile/orders page
            } else {
                alert(data.error || "Failed to place order.");
            }
        } catch (error) {
            console.error("Error placing order:", error);
        }
    });

    fetchCart();
});
