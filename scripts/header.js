document.addEventListener('DOMContentLoaded', function() {
    const toggle = document.getElementById('navbarToggle');
    const nav = document.getElementById('headerNav');
    toggle.addEventListener('click', function() {
        nav.classList.toggle('header__nav--open');
    });
    document.addEventListener('click', function(event) {
        if (!nav.contains(event.target) && !toggle.contains(event.target)) {
            nav.classList.remove('header__nav--open');
        }
    });
    const links = document.querySelectorAll('.header__nav-link');
    links.forEach(link => {
        link.addEventListener('click', function() {
            nav.classList.remove('header__nav--open');
        });
    });
});
