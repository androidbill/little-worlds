/** Native buttons with the keyboard behavior expected of a popup menu. */
export function setupMenu() {
  const toggle = document.querySelector<HTMLButtonElement>("#menu-toggle")!;
  const menu = document.querySelector<HTMLElement>("#app-menu")!;
  const container = document.querySelector<HTMLElement>(".header-actions")!;
  const items = [...menu.querySelectorAll<HTMLButtonElement>("button")];

  function close(returnFocus = true) {
    if (menu.hidden) return;
    menu.hidden = true;
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open menu");
    if (returnFocus) toggle.focus({ preventScroll: true });
  }

  function open(last = false) {
    menu.hidden = false;
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "Close menu");
    (last ? items.at(-1) : items[0])?.focus({ preventScroll: true });
  }

  toggle.onclick = () => (menu.hidden ? open() : close());
  toggle.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      event.stopPropagation();
      open(event.key === "ArrowUp");
    }
  });
  // Close before the action opens a dialog or invokes the native share sheet.
  menu.addEventListener(
    "click",
    (event) => {
      if ((event.target as Element).closest("button")) close();
    },
    { capture: true },
  );
  document.addEventListener("pointerdown", (event) => {
    if (!container.contains(event.target as Node)) close(false);
  });
  document.addEventListener("keydown", (event) => {
    if (menu.hidden) return;
    if (event.key === "Escape") {
      event.preventDefault();
      close();
    } else if (event.key === "Tab") {
      close();
    } else if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      event.preventDefault();
      const current = items.indexOf(
        document.activeElement as HTMLButtonElement,
      );
      const next =
        event.key === "Home"
          ? 0
          : event.key === "End"
            ? items.length - 1
            : (current + (event.key === "ArrowUp" ? -1 : 1) + items.length) %
              items.length;
      items[next]?.focus({ preventScroll: true });
    }
  });
  return { close };
}
