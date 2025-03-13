document.addEventListener("DOMContentLoaded", function () {
    fetchProducts();
});

async function fetchProducts() {
    try {
        const response = await fetch("/products");
        const data = await response.json();
        displayProducts(data.data);
    } catch (error) {
        console.error("Error fetching products:", error);
    }
}

function displayProducts(products) {
    const productContainer = document.getElementById("productContainer");
    productContainer.innerHTML = "";

    products.forEach(product => {
        const productCard = `
            <div class="col-md-4 mb-4">
                <div class="card">
                    <img src="${product.image}" class="card-img-top" alt="${product.name}">
                    <div class="card-body">
                        <h5 class="card-title">${product.name}</h5>
                        <p class="card-text">₹${product.price}</p>
                        <a href="#" class="btn btn-primary">Add to Cart</a>
                    </div>
                </div>
            </div>
        `;
        productContainer.innerHTML += productCard;
    });
}
