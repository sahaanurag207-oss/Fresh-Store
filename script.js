const navbar = document.querySelector('.navbar');
const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelectorAll('.nav-links a');
const searchInput = document.querySelector('.search-box input');
const searchButton = document.querySelector('.search-box button');
const productCards = document.querySelectorAll('.product-row .card');
const cartBadge = document.querySelector('.cart-badge');

let cartCount = 0;

if (menuToggle && navbar) {
    menuToggle.addEventListener('click', () => {
        const isOpen = navbar.classList.toggle('open');
        menuToggle.setAttribute('aria-expanded', String(isOpen));
    });
}

navLinks.forEach(link => {
    link.addEventListener('click', () => {
        navLinks.forEach(navLink => navLink.classList.remove('active'));
        link.classList.add('active');

        navbar?.classList.remove('open');
        menuToggle?.setAttribute('aria-expanded', 'false');
    });
});

function filterProducts() {
    const query = searchInput?.value.trim().toLowerCase() ?? '';

    productCards.forEach(card => {
        const title = card.querySelector('h3')?.textContent ?? '';
        const description = card.querySelector('p')?.textContent ?? '';
        const cardText = `${title} ${description}`.toLowerCase();
        card.hidden = !cardText.includes(query);
    });
}

searchInput?.addEventListener('input', filterProducts);
searchButton?.addEventListener('click', filterProducts);
searchInput?.addEventListener('keydown', event => {
    if (event.key === 'Enter') {
        event.preventDefault();
        filterProducts();
    }
});

productCards.forEach(card => {
    const buttons = card.querySelectorAll('.card-button button');
    const shopNowButton = buttons[0];
    const addToCartButton = buttons[1];

    addToCartButton?.addEventListener('click', () => {
        cartCount++;

        if (cartBadge) {
            cartBadge.textContent = String(cartCount);
            cartBadge.hidden = false;
        }

        const originalText = addToCartButton.textContent;
        addToCartButton.textContent = 'Added!';
        addToCartButton.disabled = true;

        window.setTimeout(() => {
            addToCartButton.textContent = originalText;
            addToCartButton.disabled = false;
        }, 1200);
    });

    shopNowButton?.addEventListener('click', () => {
        document.querySelector('#contacts')?.scrollIntoView({ behavior: 'smooth' });
    });
});
