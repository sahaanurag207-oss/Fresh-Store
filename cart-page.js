const cartStorageKey = 'freshStoreCart';
const currency = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
});
const cartItemsElement = document.querySelector('#cart-items');
const emptyCartElement = document.querySelector('#empty-cart');
const clearCartButton = document.querySelector('#clear-cart');
const subtotalElement = document.querySelector('#subtotal');
const deliveryElement = document.querySelector('#delivery');
const deliveryNoteElement = document.querySelector('#delivery-note');
const totalElement = document.querySelector('#total');
const checkoutLink = document.querySelector('#checkout-link');

function readCart() {
    const cart = JSON.parse(window.localStorage.getItem(cartStorageKey) ?? '[]');

    if (!Array.isArray(cart)) {
        throw new Error('Saved cart data is invalid.');
    }

    return cart;
}

function saveCart(cart) {
    window.localStorage.setItem(cartStorageKey, JSON.stringify(cart));
    renderCart(cart);
}

function renderCart(cart) {
    cartItemsElement.replaceChildren();
    const hasItems = cart.length > 0;
    emptyCartElement.hidden = hasItems;
    clearCartButton.hidden = !hasItems;
    checkoutLink.setAttribute('aria-disabled', String(!hasItems));
    checkoutLink.href = hasItems ? 'payment.html' : 'index.html#categories';
    checkoutLink.firstChild.textContent = hasItems ? 'Continue to payment ' : 'Continue shopping ';

    let subtotal = 0;
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;

        const row = document.createElement('article');
        row.className = 'cart-item';

        const image = document.createElement('img');
        image.className = 'cart-item-image';
        image.src = item.image;
        image.alt = item.name;

        const info = document.createElement('div');
        info.className = 'cart-item-info';
        const name = document.createElement('h3');
        name.textContent = item.name;
        const price = document.createElement('p');
        price.className = 'cart-item-price';
        price.textContent = `${currency.format(item.price)} each`;

        const quantityControls = document.createElement('div');
        quantityControls.className = 'quantity-controls';
        quantityControls.setAttribute('aria-label', `Quantity for ${item.name}`);

        const decreaseButton = document.createElement('button');
        decreaseButton.type = 'button';
        decreaseButton.dataset.action = 'decrease';
        decreaseButton.dataset.productId = item.id;
        decreaseButton.setAttribute('aria-label', `Decrease ${item.name} quantity`);
        decreaseButton.innerHTML = '<i class="fa-solid fa-minus" aria-hidden="true"></i>';

        const quantity = document.createElement('output');
        quantity.textContent = String(item.quantity);

        const increaseButton = document.createElement('button');
        increaseButton.type = 'button';
        increaseButton.dataset.action = 'increase';
        increaseButton.dataset.productId = item.id;
        increaseButton.setAttribute('aria-label', `Increase ${item.name} quantity`);
        increaseButton.innerHTML = '<i class="fa-solid fa-plus" aria-hidden="true"></i>';

        quantityControls.append(decreaseButton, quantity, increaseButton);
        info.append(name, price, quantityControls);

        const itemEnd = document.createElement('div');
        itemEnd.className = 'item-end';
        const total = document.createElement('strong');
        total.className = 'item-total';
        total.textContent = currency.format(itemTotal);

        const removeButton = document.createElement('button');
        removeButton.type = 'button';
        removeButton.className = 'remove-item';
        removeButton.dataset.action = 'remove';
        removeButton.dataset.productId = item.id;
        removeButton.textContent = 'Remove';

        itemEnd.append(total, removeButton);
        row.append(image, info, itemEnd);
        cartItemsElement.append(row);
    });

    const delivery = !hasItems || subtotal >= 35 ? 0 : 4.99;
    subtotalElement.textContent = currency.format(subtotal);
    deliveryElement.textContent = hasItems && delivery ? currency.format(delivery) : 'Free';
    totalElement.textContent = currency.format(subtotal + delivery);
    deliveryNoteElement.textContent = !hasItems
        ? 'Add items to see delivery options.'
        : delivery
            ? `Free delivery on orders of ${currency.format(35)} or more.`
            : 'Your order qualifies for free delivery.';
}

cartItemsElement.addEventListener('click', event => {
    const button = event.target.closest('button[data-action]');
    if (!button) {
        return;
    }

    const cart = readCart();
    const item = cart.find(cartItem => cartItem.id === button.dataset.productId);
    if (!item) {
        return;
    }

    switch (button.dataset.action) {
        case 'increase':
            item.quantity++;
            break;
        case 'decrease':
            item.quantity--;
            if (item.quantity < 1) {
                cart.splice(cart.indexOf(item), 1);
            }
            break;
        case 'remove':
            cart.splice(cart.indexOf(item), 1);
            break;
    }

    saveCart(cart);
});

clearCartButton.addEventListener('click', () => saveCart([]));
renderCart(readCart());
