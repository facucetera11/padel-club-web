// ============================================================
//  app.js — Navegación
// ============================================================

function showPage(pageId) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  const el = document.getElementById("page-" + pageId);
  if (el) el.classList.add("active");

  const navMap = { home:0, canchas:1, reservar:2 };
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
  if (navMap[pageId] !== undefined)
    document.querySelectorAll(".nav-btn")[navMap[pageId]].classList.add("active");

  if (pageId === "admin")   { updateAdminMetrics(); showAdminTab("overview"); }
  if (pageId === "reservar") {
    const f = document.getElementById("sel-fecha");
    if (!f.value) f.value = new Date().toISOString().split("T")[0];
    initBookingPage();
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.addEventListener("DOMContentLoaded", () => showPage("home"));