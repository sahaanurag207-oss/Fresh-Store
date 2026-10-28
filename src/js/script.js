const navbar = document.querySelector('.navbar');
const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelectorAll('.nav-links a');
const searchInput = document.querySelector('.search-box input');
const searchButton = document.querySelector('.search-box button');
const searchSuggestions = document.querySelector('#search-suggestions');
const productRow = document.querySelector('#product-list');
const productCards = [...document.querySelectorAll('.product-row .card')];
const searchStatus = document.querySelector('#search-status');
const cartBadge = document.querySelector('.cart-badge');
const cartButton = document.querySelector('#cartbtn');
const cartDrawer = document.querySelector('#cart-drawer');
const drawerItems = document.querySelector('#drawer-items');
const heroImages = document.querySelectorAll('.hero-image');
const heroPaginationButtons = document.querySelectorAll('.hero-pagination button');
const heroHeading = document.querySelector('.hero-heading');
const heroDescription = document.querySelector('.hero-description');
const testimonialCard = document.querySelector('.testimonial-card');
const reviewTrack = document.querySelector('.review-track');
const reviewSlides = document.querySelectorAll('.review-slide');

const cartStorageKey = 'freshStoreCart';
const deliveryFee = 4.99;
const freeDeliveryThreshold = 35;
const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const supportedPostalCodes = new Set(['100001', '100002', '100003', '100011']);
let cart = JSON.parse(window.localStorage.getItem(cartStorageKey) ?? '[]');
let activeCategory = 'all';

if (!Array.isArray(cart)) {
    throw new Error('Saved cart data is invalid.');
}

function getProductVariant(card) {
    const select = card.querySelector('.product-variant');
    const option = select?.selectedOptions[0];
    const baseName = card.querySelector('h3')?.textContent?.trim() ?? '';
    const label = option?.textContent?.trim() ?? '';
    return {
        id: `${card.dataset.productId}::${option?.value ?? 'single'}`,
        name: label ? `${baseName} (${label})` : baseName,
        variant: option?.value ?? 'single',
        label,
        price: Number(option?.dataset.price ?? card.dataset.price),
        image: card.querySelector('img')?.getAttribute('src') ?? '',
        baseProductId: card.dataset.productId,
        stock: Number(card.dataset.stock)
    };
}

function getBaseProductId(item) {
    return item.baseProductId ?? item.id.split('::')[0];
}

function findCardItem(card) {
    const product = getProductVariant(card);
    return cart.find(item =>
        item.id === product.id ||
        (getBaseProductId(item) === product.baseProductId &&
            (item.variant === product.variant ||
                (!item.variant && product.variant === card.querySelector('.product-variant')?.options[0]?.value)))
    );
}

function getProductTotalQuantity(productId) {
    return cart
        .filter(item => getBaseProductId(item) === productId)
        .reduce((count, item) => count + item.quantity, 0);
}

function migrateLegacyProducts() {
    let hasChanges = false;
    cart.forEach(item => {
        if (item.variant || item.baseProductId) {
            return;
        }

        const card = productCards.find(productCard => productCard.dataset.productId === item.id);
        const select = card?.querySelector('.product-variant');
        if (!card || !select) {
            return;
        }

        const option = [...select.options].find(
            variant => Number(variant.dataset.price) === Number(item.price)
        ) ?? select.options[0];
        const productName = card.querySelector('h3').textContent.trim();
        const label = option.textContent.trim();
        item.id = `${card.dataset.productId}::${option.value}`;
        item.baseProductId = card.dataset.productId;
        item.variant = option.value;
        item.label = label;
        item.name = `${productName} (${label})`;
        item.image = card.querySelector('img').getAttribute('src');
        item.stock = Number(card.dataset.stock);
        hasChanges = true;
    });

    if (hasChanges) {
        window.localStorage.setItem(cartStorageKey, JSON.stringify(cart));
    }
}

function getCartCount() {
    return cart.reduce((count, item) => count + item.quantity, 0);
}

function persistCart() {
    window.localStorage.setItem(cartStorageKey, JSON.stringify(cart));
    renderCartState();
}

function addProduct(card) {
    const product = getProductVariant(card);
    if (
        product.stock > 0 &&
        getProductTotalQuantity(product.baseProductId) >= product.stock
    ) {
        return;
    }
    let item = findCardItem(card);

    if (item) {
        item.quantity += 1;
        item.baseProductId = product.baseProductId;
        item.variant ??= product.variant;
        item.label ??= product.label;
        item.stock = product.stock;
    } else {
        item = { ...product, quantity: 1 };
        cart.push(item);
    }

    persistCart();
}

function changeProductQuantity(card, change) {
    const item = findCardItem(card);
    if (change > 0) {
        addProduct(card);
        return;
    }
    if (!item) {
        return;
    }

    item.quantity += change;
    if (item.quantity <= 0) {
        cart.splice(cart.indexOf(item), 1);
    }
    persistCart();
}

function renderProductQuantities() {
    productCards.forEach(card => {
        const quantity = card.querySelector('.product-quantity output');
        const increaseButton = card.querySelector('[data-quantity-action="increase"]');
        const item = findCardItem(card);
        const count = item?.quantity ?? 0;
        const totalCount = getProductTotalQuantity(card.dataset.productId);
        const stock = Number(card.dataset.stock);
        if (quantity) {
            quantity.textContent = String(count);
        }
        if (increaseButton) {
            increaseButton.disabled = totalCount >= stock;
            increaseButton.setAttribute(
                'aria-label',
                totalCount >= stock
                    ? `${card.querySelector('h3')?.textContent ?? 'Product'} limit reached`
                    : `Increase ${card.querySelector('h3')?.textContent ?? 'product'} quantity`
            );
        }
        card.querySelector('.product-price').textContent =
            `${currency.format(getProductVariant(card).price)} / ${getProductVariant(card).label}`;
    });
}

function renderDrawer() {
    if (!drawerItems) {
        return;
    }
    drawerItems.replaceChildren();
    const empty = cart.length === 0;
    document.querySelector('#drawer-empty').hidden = !empty;
    document.querySelector('#drawer-checkout').setAttribute('aria-disabled', String(empty));

    let subtotal = 0;
    cart.forEach(item => {
        subtotal += item.price * item.quantity;
        const row = document.createElement('article');
        row.className = 'drawer-item';

        const image = document.createElement('img');
        image.src = item.image || 'assets/Fresh_veg.jpeg';
        image.alt = '';

        const details = document.createElement('div');
        details.className = 'drawer-item-details';
        const name = document.createElement('strong');
        name.textContent = item.name;
        const unit = document.createElement('span');
        unit.textContent = `${currency.format(item.price)} each`;
        details.append(name, unit);

        const controls = document.createElement('div');
        controls.className = 'drawer-quantity';
        const decrease = document.createElement('button');
        decrease.type = 'button';
        decrease.dataset.drawerAction = 'decrease';
        decrease.dataset.productId = item.id;
        decrease.setAttribute('aria-label', `Decrease ${item.name} quantity`);
        decrease.textContent = '−';
        const quantity = document.createElement('output');
        quantity.textContent = String(item.quantity);
        const increase = document.createElement('button');
        increase.type = 'button';
        increase.dataset.drawerAction = 'increase';
        increase.dataset.productId = item.id;
        increase.disabled = Number(item.stock) > 0 &&
            getProductTotalQuantity(getBaseProductId(item)) >= Number(item.stock);
        increase.setAttribute('aria-label', `Increase ${item.name} quantity`);
        increase.textContent = '+';
        controls.append(decrease, quantity, increase);

        const price = document.createElement('strong');
        price.className = 'drawer-item-total';
        price.textContent = currency.format(item.price * item.quantity);
        row.append(image, details, controls, price);
        drawerItems.append(row);
    });

    const delivery = empty || subtotal >= freeDeliveryThreshold ? 0 : deliveryFee;
    const total = subtotal + delivery;
    const remaining = Math.max(0, freeDeliveryThreshold - subtotal);
    document.querySelector('#drawer-subtotal').textContent = currency.format(subtotal);
    document.querySelector('#drawer-delivery').textContent = delivery ? currency.format(delivery) : 'Free';
    document.querySelector('#drawer-total').textContent = currency.format(total);
    document.querySelector('#drawer-delivery-progress').textContent = remaining
        ? `Add ${currency.format(remaining)} more for free delivery.`
        : 'You unlocked free delivery!';
    updateProgress(document.querySelector('#cart-drawer .delivery-progress'), subtotal);
}

function updateProgress(progress, subtotal) {
    if (!progress) {
        return;
    }
    const value = Math.min(freeDeliveryThreshold, subtotal);
    progress.setAttribute('aria-valuenow', String(value));
    progress.querySelector('span').style.width = `${(value / freeDeliveryThreshold) * 100}%`;
}

function renderCartState() {
    const count = getCartCount();
    if (cartBadge) {
        cartBadge.textContent = String(count);
        cartBadge.hidden = count === 0;
    }
    cartButton?.setAttribute(
        'aria-label',
        `Shopping cart, ${count} ${count === 1 ? 'item' : 'items'}`
    );
    renderProductQuantities();
    renderDrawer();
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

if (testimonialCard && reviewTrack && reviewSlides.length > 1) {
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

function renderCatalog() {
    const query = searchInput?.value.trim().toLowerCase() ?? '';
    const visibleCards = [];
    productCards.forEach((card, index) => {
        const matchesQuery = card.textContent.toLowerCase().includes(query);
        const matchesCategory = activeCategory === 'all' || card.dataset.category === activeCategory;
        card.hidden = !(matchesQuery && matchesCategory);
        if (card.dataset.originalOrder === undefined) {
            card.dataset.originalOrder = String(index);
        }
        if (!card.hidden) {
            visibleCards.push(card);
        }
    });

    const sort = document.querySelector('#product-sort')?.value ?? 'featured';
    visibleCards.sort((a, b) => {
        if (sort === 'price-asc') {
            return getProductVariant(a).price - getProductVariant(b).price;
        }
        if (sort === 'popularity') {
            return Number(b.dataset.popularity) - Number(a.dataset.popularity);
        }
        if (sort === 'freshness') {
            return Number(b.dataset.freshness) - Number(a.dataset.freshness);
        }
        return Number(a.dataset.originalOrder) - Number(b.dataset.originalOrder);
    });
    visibleCards.forEach(card => productRow.append(card));

    if (searchStatus) {
        searchStatus.hidden = !query;
        searchStatus.textContent = query
            ? `${visibleCards.length} ${visibleCards.length === 1 ? 'product' : 'products'} found.`
            : '';
    }
}

function renderSuggestions() {
    if (!searchSuggestions) {
        return;
    }
    const query = searchInput.value.trim().toLowerCase();
    searchSuggestions.replaceChildren();
    if (!query) {
        searchSuggestions.hidden = true;
        searchInput.setAttribute('aria-expanded', 'false');
        return;
    }

    const matches = productCards.filter(card => card.textContent.toLowerCase().includes(query)).slice(0, 5);
    matches.forEach(card => {
        const option = document.createElement('button');
        option.type = 'button';
        option.className = 'search-suggestion';
        option.setAttribute('role', 'option');
        const image = document.createElement('img');
        image.src = card.querySelector('img').getAttribute('src');
        image.alt = '';
        const label = document.createElement('span');
        label.textContent = card.querySelector('h3').textContent;
        const price = document.createElement('strong');
        price.textContent = currency.format(getProductVariant(card).price);
        option.append(image, label, price);
        option.addEventListener('click', () => {
            activeCategory = 'all';
            document.querySelectorAll('[data-category-filter]').forEach(button => {
                const isActive = button.dataset.categoryFilter === 'all';
                button.classList.toggle('active', isActive);
                button.setAttribute('aria-pressed', String(isActive));
            });
            searchSuggestions.hidden = true;
            searchInput.setAttribute('aria-expanded', 'false');
            searchInput.value = card.querySelector('h3').textContent;
            renderCatalog();
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
        searchSuggestions.append(option);
    });
    searchSuggestions.hidden = matches.length === 0;
    searchInput.setAttribute('aria-expanded', String(matches.length > 0));
}

searchInput?.addEventListener('input', () => {
    renderCatalog();
    renderSuggestions();
});
searchButton?.addEventListener('click', () => {
    renderCatalog();
    searchSuggestions.hidden = true;
    searchInput.setAttribute('aria-expanded', 'false');
    document.querySelector('#categories')?.scrollIntoView({ behavior: 'smooth' });
});
searchInput?.addEventListener('keydown', event => {
    if (event.key === 'Enter') {
        event.preventDefault();
        renderCatalog();
        searchSuggestions.hidden = true;
        searchInput.setAttribute('aria-expanded', 'false');
        document.querySelector('#categories')?.scrollIntoView({ behavior: 'smooth' });
    }
    if (event.key === 'Escape') {
        searchSuggestions.hidden = true;
        searchInput.setAttribute('aria-expanded', 'false');
    }
});

document.querySelectorAll('[data-category-filter]').forEach(button => {
    button.addEventListener('click', () => {
        activeCategory = button.dataset.categoryFilter;
        document.querySelectorAll('[data-category-filter]').forEach(filterButton => {
            const isActive = filterButton === button;
            filterButton.classList.toggle('active', isActive);
            filterButton.setAttribute('aria-pressed', String(isActive));
        });
        renderCatalog();
    });
});
document.querySelector('#product-sort')?.addEventListener('change', renderCatalog);

productCards.forEach(card => {
    card.querySelector('.product-variant')?.addEventListener('change', renderProductQuantities);
    card.querySelector('.product-quantity')?.addEventListener('click', event => {
        const button = event.target.closest('[data-quantity-action]');
        if (button && !button.disabled) {
            changeProductQuantity(card, button.dataset.quantityAction === 'increase' ? 1 : -1);
        }
    });
    card.querySelector('.quick-view-button')?.addEventListener('click', () => {
        const dialog = document.querySelector('#product-detail-dialog');
        document.querySelector('#detail-image').src = card.querySelector('img').getAttribute('src');
        document.querySelector('#detail-image').alt = card.querySelector('img').alt;
        document.querySelector('#detail-title').textContent = card.querySelector('h3').textContent;
        document.querySelector('#detail-origin').textContent = card.dataset.origin;
        document.querySelector('#detail-storage').textContent = card.dataset.storage;
        document.querySelector('#detail-shelf-life').textContent = card.dataset.shelfLife;
        dialog.showModal();
    });
});

cartButton?.addEventListener('click', () => cartDrawer.showModal());
drawerItems?.addEventListener('click', event => {
    const button = event.target.closest('[data-drawer-action]');
    if (!button) {
        return;
    }
    const item = cart.find(cartItem => cartItem.id === button.dataset.productId);
    if (!item) {
        return;
    }
    if (button.dataset.drawerAction === 'increase') {
        if (
            Number(item.stock) > 0 &&
            getProductTotalQuantity(getBaseProductId(item)) >= Number(item.stock)
        ) {
            return;
        }
        item.quantity += 1;
    } else {
        item.quantity -= 1;
        if (item.quantity <= 0) {
            cart.splice(cart.indexOf(item), 1);
        }
    }
    persistCart();
});

document.querySelectorAll('[data-close-dialog]').forEach(button => {
    button.addEventListener('click', () => button.closest('dialog').close());
});
document.querySelectorAll('dialog').forEach(dialog => {
    dialog.addEventListener('click', event => {
        if (event.target === dialog) {
            dialog.close();
        }
    });
});
document.querySelector('#drawer-checkout')?.addEventListener('click', event => {
    if (!cart.length) {
        event.preventDefault();
    }
});

document.querySelector('#delivery-checker')?.addEventListener('submit', event => {
    event.preventDefault();
    const postalCode = document.querySelector('#delivery-postal-code').value.trim();
    const status = document.querySelector('#delivery-status');
    status.textContent = supportedPostalCodes.has(postalCode)
        ? `Good news — ${postalCode} is in this demo's sample delivery area.`
        : `${postalCode} is not in this demo's sample area. Try 100001, 100002, 100003, or 100011.`;
    status.classList.toggle('is-available', supportedPostalCodes.has(postalCode));
    status.classList.toggle('is-unavailable', !supportedPostalCodes.has(postalCode));
});

migrateLegacyProducts();
renderCartState();

window.addEventListener('storage', event => {
    if (event.key === cartStorageKey) {
        cart = JSON.parse(event.newValue ?? '[]');
        if (!Array.isArray(cart)) {
            throw new Error('Saved cart data is invalid.');
        }
        renderCartState();
    }
});
