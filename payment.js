const cartStorageKey = 'freshStoreCart';
const currency = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
});
const cart = JSON.parse(window.localStorage.getItem(cartStorageKey) ?? '[]');
const form = document.querySelector('#payment-form');
const confirmation = document.querySelector('#order-confirmation');
const checkoutItems = document.querySelector('#checkout-items');
const subtotalElement = document.querySelector('#subtotal');
const deliveryElement = document.querySelector('#delivery');
const deliveryNoteElement = document.querySelector('#delivery-note');
const totalElement = document.querySelector('#total');

if (!Array.isArray(cart) || cart.length === 0) {
    window.location.replace('cart.html');
} else {
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
    subtotalElement.textContent = currency.format(subtotal);
    deliveryElement.textContent = delivery ? currency.format(delivery) : 'Free';
    deliveryNoteElement.textContent = delivery
        ? `Free delivery on orders of ${currency.format(35)} or more.`
        : 'Your order qualifies for free delivery.';
    totalElement.textContent = currency.format(subtotal + delivery);

    form.addEventListener('submit', event => {
        event.preventDefault();

        if (!form.reportValidity()) {
            return;
        }

        window.localStorage.removeItem(cartStorageKey);
        form.hidden = true;
        confirmation.hidden = false;
    });
}
