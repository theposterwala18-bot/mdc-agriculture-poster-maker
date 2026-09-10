const deathModuleCard = document.querySelector('[data-module-id="death"]');

if (deathModuleCard) {
  deathModuleCard.classList.add("available");
  const status = deathModuleCard.querySelector(".module-status");
  if (status) status.textContent = "OPEN";

  deathModuleCard.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    window.mdcTrack?.("module_open", { selected_module: "death" });
    window.location.href = "death-bhog.html";
  }, { capture: true });
}
