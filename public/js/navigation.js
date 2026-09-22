const navButton = document.querySelector("[data-nav-toggle]");
const navMenu = document.querySelector("[data-nav-menu]");

if (navButton && navMenu) {
  navButton.addEventListener("click", () => {
    const isOpen = navMenu.classList.toggle("is-open");

    navButton.setAttribute("aria-expanded", String(isOpen));
  });
}
