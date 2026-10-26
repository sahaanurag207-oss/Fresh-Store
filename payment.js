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

const codOption = document.querySelector('input[name="paymentMethod"][value="cash-on-delivery"]');
const codOptionLabel = document.querySelector('#cod-option-label');
const upiOption = document.querySelector('input[name="paymentMethod"][value="upi"]');
const paymentDisclaimer = document.querySelector('#payment-disclaimer');

// Suggested grab-and-go products
const quickAddItems = [
    { id: 'fresh-lemons', name: 'Fresh Lemons (3 pcs)', price: 1.49 },
    { id: 'baby-spinach', name: 'Baby Spinach (250g)', price: 2.19 },
    { id: 'organic-bananas', name: 'Organic Bananas (1 bunch)', price: 1.89 }
];

let finalTotal = 0;

function renderQuickAdd() {
    if (!quickAddList) return;
    quickAddList.innerHTML = '';

    quickAddItems.forEach(item => {
        const card = document.createElement('div');
        card.className = 'quick-add-card';

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

        card.append(info, addBtn);
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
            quantity: 1
        });
    }

    // Persist updated cart to localStorage
    window.localStorage.setItem(cartStorageKey, JSON.stringify(cart));

    // Re-render summary, delivery fee, and COD eligibility
    updateOrderView();
}

function updateOrderView() {
    checkoutItems.innerHTML = '';
    let subtotal = 0;

    cart.forEach(item => {
        subtotal += item.price * item.quantity;

        const row = document.createElement('div');
        row.className = 'checkout-item';

        const itemLabel = document.createElement('span');
        itemLabel.textContent = `${item.name} × ${item.quantity}`;

        const itemTotal = document.createElement('strong');
        itemTotal.textContent = currency.format(item.price * item.quantity);

        row.append(itemLabel, itemTotal);
        checkoutItems.append(row);
    });

    const delivery = subtotal >= 35 ? 0 : 4.99;
    finalTotal = subtotal + delivery;

    subtotalElement.textContent = currency.format(subtotal);
    deliveryElement.textContent = delivery ? currency.format(delivery) : 'Free';
    deliveryNoteElement.textContent = delivery
        ? `Free delivery on orders of ${currency.format(35)} or more.`
        : 'Your order qualifies for free delivery.';
    totalElement.textContent = currency.format(finalTotal);

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

        window.localStorage.removeItem(cartStorageKey);
        form.hidden = true;
        confirmation.hidden = false;
    });
}