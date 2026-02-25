// ui-backtotop.js
export function initBackToTop(btnId) {
    const btn = document.getElementById(btnId);
    if (!btn) return;

    window.addEventListener("scroll", () => {
        btn.classList.toggle("visible", window.scrollY > 400);
        btn.style.display = window.scrollY > 400 ? "block" : "none";
    });

    btn.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    });
}
