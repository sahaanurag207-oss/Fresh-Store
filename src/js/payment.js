const cartStorageKey = 'freshStoreCart';
const currency = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
});

// Load cart from localStorage
let cart = JSON.parse(window.localStorage.getItem(cartStorageKey) ?? '[]');

// DOM Elements
const form = document.querySelector('#payment-form');
const confirmation = document.querySelector('#order-confirmation');
const checkoutItems = document.querySelector('#checkout-items');
const quickAddList = document.querySelector('#quick-add-list');
const subtotalElement = document.querySelector('#subtotal');
const deliveryElement = document.querySelector('#delivery');
const deliveryNoteElement = document.querySelector('#delivery-note');
const totalElement = document.querySelector('#total');
const deliveryProgressText = document.querySelector('#checkout-delivery-progress');
const couponForm = document.querySelector('#coupon-form');
const couponInput = document.querySelector('#coupon-code');
const couponStatus = document.querySelector('#coupon-status');
const discountLine = document.querySelector('#discount-line');
const discountElement = document.querySelector('#discount');
const freeDeliveryThreshold = 35;
const deliveryFeeAmount = 4.99;
const couponStorageKey = 'freshStoreCoupon';
let appliedCoupon = window.localStorage.getItem(couponStorageKey) ?? '';

const codOption = document.querySelector('input[name="paymentMethod"][value="cash-on-delivery"]');
const codOptionLabel = document.querySelector('#cod-option-label');
const upiOption = document.querySelector('input[name="paymentMethod"][value="upi"]');
const paymentDisclaimer = document.querySelector('#payment-disclaimer');

// Suggested grab-and-go products
const quickAddItems = [
    { id: 'fresh-lemons', name: 'Fresh Lemons (3 pcs)', price: 1.49, image: 'assets/fresh lemons.jpg' },
    { id: 'baby-spinach', name: 'Baby Spinach (250g)', price: 2.19, image: 'assets/baby spinach.jpg' },
    { id: 'organic-bananas', name: 'Organic Bananas (1 bunch)', price: 1.89, image: 'assets/organic banana.jpg' }
];

let finalTotal = 0;

function getPricePerKilogram(price, label) {
    const weight = label.match(/(\d+(?:\.\d+)?)\s*(g|kg)\b/i);
    if (!weight) {
        return null;
    }

    const amount = Number(weight[1]);
    const kilograms = weight[2].toLowerCase() === 'g' ? amount / 1000 : amount;
    return price / kilograms;
}

function renderQuickAdd() {
    if (!quickAddList) return;
    quickAddList.innerHTML = '';

    quickAddItems.forEach(item => {
        const card = document.createElement('div');
        card.className = 'quick-add-card';

        const image = document.createElement('img');
        image.className = 'quick-add-image';
        image.src = `../${item.image}`;
        image.alt = '';
        image.loading = 'lazy';

        const info = document.createElement('div');
        info.className = 'quick-add-info';

        const name = document.createElement('span');
        name.className = 'quick-add-name';
        name.textContent = item.name;

        const price = document.createElement('span');
        price.className = 'quick-add-price';
        price.textContent = currency.format(item.price);

        info.append(name, price);

        const addBtn = document.createElement('button');
        addBtn.type = 'button';
        addBtn.className = 'quick-add-btn';
        addBtn.innerHTML = '<i class="fa-solid fa-plus" aria-hidden="true"></i> Add';

        addBtn.addEventListener('click', () => {
            addItemToCart(item);
        });

        card.append(image, info, addBtn);
        quickAddList.append(card);
    });
}

function addItemToCart(item) {
    const existing = cart.find(cartItem => cartItem.name === item.name || cartItem.id === item.id);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({
            id: item.id,
            name: item.name,
            price: item.price,
            image: item.image,
            quantity: 1
        });
    }

    // Persist updated cart to localStorage
    window.localStorage.setItem(cartStorageKey, JSON.stringify(cart));

    // Re-render summary, delivery fee, and COD eligibility
    updateOrderView();
}

function saveCart() {
    window.localStorage.setItem(cartStorageKey, JSON.stringify(cart));
}

function getProductTotalQuantity(productId) {
    return cart
        .filter(item => (item.baseProductId ?? item.id.split('::')[0]) === productId)
        .reduce((count, item) => count + item.quantity, 0);
}

function updateOrderView() {
    checkoutItems.innerHTML = '';
    let subtotal = 0;

    cart.forEach(item => {
        subtotal += item.price * item.quantity;

        const row = document.createElement('div');
        row.className = 'checkout-item';

        const image = document.createElement('img');
        image.className = 'checkout-item-image';
        const imageSource = item.image || 'assets/Fresh_veg.jpeg';
        image.src = imageSource.startsWith('assets/') ? `../${imageSource}` : imageSource;
        image.alt = '';
        image.loading = 'lazy';

        const itemLabel = document.createElement('span');
        itemLabel.className = 'checkout-item-name';
        itemLabel.textContent = item.name;

        const itemTotal = document.createElement('strong');
        itemTotal.textContent = currency.format(item.price * item.quantity);

        const details = document.createElement('div');
        details.className = 'checkout-item-details';
        const unitPrice = document.createElement('span');
        unitPrice.className = 'checkout-item-unit-price';
        unitPrice.textContent = `${currency.format(item.price)} / ${item.label ?? 'item'}`;
        const unitPricePerKg = item.unitPricePerKg ?? getPricePerKilogram(item.price, item.label ?? '');
        if (unitPricePerKg !== null) {
            const comparison = document.createElement('small');
            comparison.className = 'unit-price-comparison';
            comparison.textContent = `${currency.format(unitPricePerKg)}/kg`;
            unitPrice.append(' · ', comparison);
        }

        const quantityControls = document.createElement('div');
        quantityControls.className = 'checkout-quantity-controls';
        quantityControls.setAttribute('aria-label', `Quantity for ${item.name}`);

        const decreaseButton = document.createElement('button');
        decreaseButton.type = 'button';
        decreaseButton.className = 'checkout-quantity-button';
        decreaseButton.dataset.action = 'decrease';
        decreaseButton.dataset.productId = item.id;
        decreaseButton.disabled = item.quantity <= 1;
        decreaseButton.setAttribute('aria-label', `Decrease ${item.name} quantity`);
        decreaseButton.innerHTML = '<i class="fa-solid fa-minus" aria-hidden="true"></i>';

        const quantity = document.createElement('output');
        quantity.className = 'checkout-quantity';
        quantity.setAttribute('aria-label', 'Quantity');
        quantity.textContent = String(item.quantity);

        const increaseButton = document.createElement('button');
        increaseButton.type = 'button';
        increaseButton.className = 'checkout-quantity-button';
        increaseButton.dataset.action = 'increase';
        increaseButton.dataset.productId = item.id;
        increaseButton.disabled = Number(item.stock) > 0 &&
            getProductTotalQuantity(item.baseProductId ?? item.id.split('::')[0]) >= Number(item.stock);
        increaseButton.setAttribute('aria-label', `Increase ${item.name} quantity`);
        increaseButton.innerHTML = '<i class="fa-solid fa-plus" aria-hidden="true"></i>';

        quantityControls.append(decreaseButton, quantity, increaseButton);
        details.append(itemLabel, unitPrice, quantityControls);

        const actions = document.createElement('div');
        actions.className = 'checkout-item-actions';
        const removeButton = document.createElement('button');
        removeButton.type = 'button';
        removeButton.className = 'checkout-remove-button';
        removeButton.dataset.action = 'remove';
        removeButton.dataset.productId = item.id;
        removeButton.textContent = 'Remove';
        actions.append(itemTotal, removeButton);

        row.append(image, details, actions);
        checkoutItems.append(row);
    });

    const delivery = subtotal >= freeDeliveryThreshold ? 0 : deliveryFeeAmount;
    const couponIsEligible = appliedCoupon === 'FRESH30' && subtotal >= 20;
    const discount = couponIsEligible ? Math.min(subtotal * 0.3, 10) : 0;
    finalTotal = subtotal + delivery - discount;

    subtotalElement.textContent = currency.format(subtotal);
    deliveryElement.textContent = delivery ? currency.format(delivery) : 'Free';
    deliveryNoteElement.textContent = delivery
        ? `Free delivery on orders of ${currency.format(freeDeliveryThreshold)} or more.`
        : 'Your order qualifies for free delivery.';
    totalElement.textContent = currency.format(finalTotal);
    discountLine.hidden = !discount;
    discountElement.textContent = `-${currency.format(discount)}`;
    if (couponInput && appliedCoupon) {
        couponInput.value = appliedCoupon;
        couponStatus.textContent = couponIsEligible
            ? `FRESH30 applied: ${currency.format(discount)} off this order.`
            : `FRESH30 requires a ${currency.format(20)} subtotal. Add ${currency.format(Math.max(0, 20 - subtotal))} more to use it.`;
    }

    const remaining = Math.max(0, freeDeliveryThreshold - subtotal);
    deliveryProgressText.textContent = remaining
        ? `Add ${currency.format(remaining)} more for free delivery.`
        : 'You unlocked free delivery!';
    const progress = document.querySelector('.delivery-progress');
    const progressValue = Math.min(freeDeliveryThreshold, subtotal);
    progress.setAttribute('aria-valuenow', String(progressValue));
    progress.querySelector('span').style.width = `${(progressValue / freeDeliveryThreshold) * 100}%`;

    // Cash on Delivery eligibility threshold ($10.01 or higher)
    const isCodEligible = finalTotal > 10;

    if (!isCodEligible) {
        if (codOption) {
            codOption.disabled = true;
            codOption.checked = false;
        }
        if (codOptionLabel) {
            codOptionLabel.style.opacity = '0.5';
            codOptionLabel.style.cursor = 'not-allowed';
        }
        if (upiOption) {
            upiOption.checked = true;
        }
        if (paymentDisclaimer) {
            paymentDisclaimer.textContent = 'Orders of $10.00 or less are only eligible for UPI payment.';
        }
    } else {
        if (codOption) {
            codOption.disabled = false;
        }
        if (codOptionLabel) {
            codOptionLabel.style.opacity = '1';
            codOptionLabel.style.cursor = 'pointer';
        }
        if (paymentDisclaimer) {
            paymentDisclaimer.textContent = '';
        }
    }
}

couponForm.addEventListener('submit', event => {
    event.preventDefault();
    const code = couponInput.value.trim().toUpperCase();
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    if (code !== 'FRESH30') {
        appliedCoupon = '';
        window.localStorage.removeItem(couponStorageKey);
        couponStatus.textContent = 'That promo code is not valid. Try FRESH30.';
    } else if (subtotal < 20) {
        appliedCoupon = '';
        window.localStorage.removeItem(couponStorageKey);
        couponStatus.textContent = `FRESH30 applies to orders of ${currency.format(20)} or more.`;
    } else {
        appliedCoupon = code;
        window.localStorage.setItem(couponStorageKey, appliedCoupon);
        couponStatus.textContent = 'FRESH30 applied: 30% off, up to $10.';
    }
    updateOrderView();
});

checkoutItems.addEventListener('click', event => {
    const button = event.target.closest('button[data-action]');
    if (!button) {
        return;
    }

    const item = cart.find(cartItem => cartItem.id === button.dataset.productId);
    if (!item) {
        return;
    }

    if (button.dataset.action === 'increase') {
        if (
            Number(item.stock) > 0 &&
            getProductTotalQuantity(item.baseProductId ?? item.id.split('::')[0]) >= Number(item.stock)
        ) {
            return;
        }
        item.quantity += 1;
    } else if (button.dataset.action === 'decrease' && item.quantity > 1) {
        item.quantity -= 1;
    } else if (button.dataset.action === 'remove') {
        cart.splice(cart.indexOf(item), 1);
    } else {
        return;
    }

    if (cart.length === 0) {
        window.localStorage.removeItem(cartStorageKey);
        window.location.href = 'cart.html';
        return;
    }

    saveCart();
    updateOrderView();
});

// Redirect if cart is empty, otherwise initialize
if (!Array.isArray(cart) || cart.length === 0) {
    window.location.replace('cart.html');
} else {
    renderQuickAdd();
    updateOrderView();

    form.addEventListener('submit', event => {
        event.preventDefault();

        const selectedPaymentMethod = form.elements['paymentMethod']?.value;

        if (finalTotal <= 10 && selectedPaymentMethod === 'cash-on-delivery') {
            alert('Orders of $10.00 or less must be paid via UPI.');
            return;
        }

        if (!form.reportValidity()) {
            return;
        }

        const selectedPaymentLabel = selectedPaymentMethod === 'cash-on-delivery'
            ? 'Cash on delivery'
            : 'UPI payment';
        const orderItemCount = cart.reduce((count, item) => count + item.quantity, 0);
        document.querySelector('#confirmation-reference').textContent =
            `FS-${Date.now().toString().slice(-8)}`;
        document.querySelector('#confirmation-item-count').textContent =
            `${orderItemCount} ${orderItemCount === 1 ? 'item' : 'items'}`;
        document.querySelector('#confirmation-slot').textContent =
            form.elements['deliverySlot'].value;
        document.querySelector('#confirmation-payment').textContent = selectedPaymentLabel;
        document.querySelector('#confirmation-total').textContent = currency.format(finalTotal);

        window.localStorage.removeItem(cartStorageKey);
        window.localStorage.removeItem(couponStorageKey);
        form.hidden = true;
        confirmation.hidden = false;
        const layout = document.querySelector('.payment-layout');
        layout.classList.add('order-complete');
        layout.querySelector('.payment-panel').setAttribute('aria-labelledby', 'confirmation-heading');
        confirmation.focus();
    });
}
