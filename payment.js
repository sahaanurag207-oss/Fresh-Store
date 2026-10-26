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

const codOption = document.querySelector('input[name="paymentMethod"][value="cash-on-delivery"]');
const codOptionLabel = document.querySelector('#cod-option-label');
const upiOption = document.querySelector('input[name="paymentMethod"][value="upi"]');
const paymentDisclaimer = document.querySelector('#payment-disclaimer');

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
    const finalTotal = subtotal + delivery;

    subtotalElement.textContent = currency.format(subtotal);
    deliveryElement.textContent = delivery ? currency.format(delivery) : 'Free';
    deliveryNoteElement.textContent = delivery
        ? `Free delivery on orders of ${currency.format(35)} or more.`
        : 'Your order qualifies for free delivery.';
    totalElement.textContent = currency.format(finalTotal);

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
            codOption.checked = true;
        }
        if (paymentDisclaimer) {
            paymentDisclaimer.textContent = '';
        }
    }

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