const navbar = document.querySelector('.navbar');
        const menuToggle = document.querySelector('.menu-toggle');

        if (menuToggle && navbar) {
            menuToggle.addEventListener('click', () => {
                const isOpen = navbar.classList.toggle('open');
                menuToggle.setAttribute('aria-expanded', String(isOpen));
            });
        }