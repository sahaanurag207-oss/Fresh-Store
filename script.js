const navbar = document.querySelector('.navbar');
const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelectorAll('.nav-links a');
const searchInput = document.querySelector('.search-box input');
const searchButton = document.querySelector('.search-box button');
const productCards = document.querySelectorAll('.product-row .card');
const searchStatus = document.querySelector('#search-status');
const cartBadge = document.querySelector('.cart-badge');
const heroImages = document.querySelectorAll('.hero-image');
const heroPaginationButtons = document.querySelectorAll('.hero-pagination button');
const heroHeading = document.querySelector('.hero-heading');
const heroDescription = document.querySelector('.hero-description');
const testimonialCard = document.querySelector('.testimonial-card');
const reviewTrack = document.querySelector('.review-track');
const reviewSlides = document.querySelectorAll('.review-slide');

const cartStorageKey = 'freshStoreCart';
const savedCart = JSON.parse(window.localStorage.getItem(cartStorageKey) ?? '[]');
const savedCartCount = savedCart.reduce((count, item) => count + item.quantity, 0);

if (cartBadge) {
    cartBadge.textContent = String(savedCartCount);
    cartBadge.hidden = savedCartCount === 0;
    document.querySelector('#cartbtn')?.setAttribute(
        'aria-label',
        `Shopping cart, ${savedCartCount} ${savedCartCount === 1 ? 'item' : 'items'}`
    );
}

if (
    heroImages.length &&
    heroPaginationButtons.length === heroImages.length &&
    heroHeading &&
    heroDescription
) {
    let activeHeroImage = 0;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function showHeroImage(index) {
        activeHeroImage = (index + heroImages.length) % heroImages.length;

        heroImages.forEach((image, imageIndex) => {
            const isActive = imageIndex === activeHeroImage;
            image.classList.toggle('active', isActive);
            image.setAttribute('aria-hidden', String(!isActive));

            if (isActive) {
                heroHeading.textContent = image.dataset.title ?? '';
                heroDescription.textContent = image.dataset.description ?? '';
            }
        });

        heroPaginationButtons.forEach((button, buttonIndex) => {
            const isActive = buttonIndex === activeHeroImage;
            button.classList.toggle('active', isActive);
            button.setAttribute('aria-pressed', String(isActive));
        });
    }

    heroPaginationButtons.forEach((button, index) => {
        button.addEventListener('click', () => showHeroImage(index));
    });

    if (!reducedMotion) {
        window.setInterval(() => showHeroImage(activeHeroImage + 1), 5000);
    }
}

if (
    testimonialCard &&
    reviewTrack &&
    reviewSlides.length > 1
) {
    let activeReview = 0;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function showReview(index) {
        activeReview = (index + reviewSlides.length) % reviewSlides.length;
        reviewTrack.style.transform = `translateX(-${activeReview * 100}%)`;

        reviewSlides.forEach((slide, slideIndex) => {
            slide.setAttribute('aria-hidden', String(slideIndex !== activeReview));
        });
    }

    if (!reducedMotion) {
        window.setInterval(() => showReview(activeReview + 1), 5000);
    }
}

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
    let visibleCount = 0;

    productCards.forEach(card => {
        const matches = card.textContent.toLowerCase().includes(query);
        card.hidden = !matches;
        visibleCount += Number(matches);
    });

    if (searchStatus) {
        searchStatus.hidden = query.length === 0;
        searchStatus.textContent = !query
            ? ''
            : visibleCount
                ? `${visibleCount} ${visibleCount === 1 ? 'product' : 'products'} found.`
                : `No products found for “${searchInput.value.trim()}”.`;
    }
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
        const cart = JSON.parse(window.localStorage.getItem(cartStorageKey) ?? '[]');
        const productId = card.dataset.productId;
        const existingItem = cart.find(item => item.id === productId);

        if (!productId) {
            throw new Error('A product is missing its cart ID.');
        }

        if (existingItem) {
            existingItem.quantity++;
        } else {
            cart.push({
                id: productId,
                name: card.querySelector('h3')?.textContent?.trim() ?? '',
                price: Number(card.dataset.price),
                image: card.querySelector('img')?.getAttribute('src') ?? '',
                quantity: 1
            });
        }

        window.localStorage.setItem(cartStorageKey, JSON.stringify(cart));
        const cartCount = cart.reduce((count, item) => count + item.quantity, 0);
        if (cartBadge) {
            cartBadge.textContent = String(cartCount);
            cartBadge.hidden = cartCount === 0;
        }
        document.querySelector('#cartbtn')?.setAttribute(
            'aria-label',
            `Shopping cart, ${cartCount} ${cartCount === 1 ? 'item' : 'items'}`
        );

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
