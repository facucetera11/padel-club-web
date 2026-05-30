// ============================================================
//  admin.js — Panel de administración
// ============================================================

function adminLogin() {
  const user = document.getElementById("admin-user").value;
  const pass = document.getElementById("admin-pass").value;
  const err  = document.getElementById("login-err");
  if (user === CONFIG.adminUsuario && pass === CONFIG.adminPassword) {
    err.style.display = "none";
    showPage("admin");
  } else {
    err.style.display = "block";
    document.getElementById("login-card").classList.add("shake");
    setTimeout(() => document.getElementById("login-card").classList.remove("shake"), 500);
  }
}

function adminLogout() { showPage("home"); }

function showAdminTab(tab) {
  ["overview","reservas","agenda"].forEach(t => {
    document.getElementById("admin-" + t).style.display = t === tab ? "block" : "none";
  });
  document.querySelectorAll(".anav-btn").forEach((btn, i) => {
    btn.classList.toggle("active", ["overview","reservas","agenda"][i] === tab);
  });
  if (tab === "overview") updateAdminMetrics();
  if (tab === "reservas") renderReservas();
  if (tab === "agenda")   renderAgenda();
}

function updateAdminMetrics() {
  const today   = new Date().toISOString().split("T")[0];
  const activas = bookings.filter(b => b.estado !== "cancelled");
  const hoy     = activas.filter(b => b.fecha === today).length;
  const semana  = activas.length;

  document.getElementById("m-hoy").textContent     = hoy;
  document.getElementById("m-semana").textContent  = semana;
  document.getElementById("m-ingresos").textContent = "$" + (semana * CONFIG.precioPorHora).toLocaleString("es-AR");
  document.getElementById("m-ingresos-sub").textContent = "@$" + CONFIG.precioPorHora.toLocaleString("es-AR") + "/hora";

  const now  = new Date();
  const curH = now.getHours();
  const todayBookedHours = activas.filter(b => b.fecha === today).map(b => parseInt(b.hora));
  const nextFree = getHours().find(h => parseInt(h) > curH && !todayBookedHours.includes(parseInt(h)));
  document.getElementById("m-libre").textContent     = nextFree || "Mañana";
  document.getElementById("m-libre-sub").textContent = nextFree ? "hoy disponible" : "sin turnos libres hoy";
}

function renderReservas() {
  const all = [...bookings].sort((a,b) => (a.fecha+a.hora).localeCompare(b.fecha+b.hora));
  document.getElementById("res-count").textContent = all.length + " registros";
  const tbody = document.getElementById("reservas-tbody");
  tbody.innerHTML = all.map(b => {
    const cl = b.estado === "confirmed" ? "status-confirmed" : b.estado === "pending" ? "status-pending" : "status-cancelled";
    const lb = b.estado === "confirmed" ? "Confirmado" : b.estado === "pending" ? "Pendiente" : "Cancelado";
    return `<tr>
      <td><div class="td-name">${b.nombre}</div><div class="td-sub">${b.tel}</div></td>
      <td>${b.cancha}</td>
      <td>${new Date(b.fecha+"T12:00").toLocaleDateString("es-AR",{day:"numeric",month:"short"})}</td>
      <td>${b.hora}</td>
      <td><span class="status-badge ${cl}">${lb}</span></td>
      <td><button class="del-btn" onclick="cancelReserva(${b.id})" title="Cancelar"><i class="ti ti-x"></i></button></td>
    </tr>`;
  }).join("");
}

function cancelReserva(id) {
  const b = bookings.find(b => b.id === id);
  if (b) b.estado = "cancelled";
  renderReservas();
  updateAdminMetrics();
}

function renderAgenda() {
  const days = [];
  const base = new Date();
  for (let i = 0; i < 5; i++) {
    const d = new Date(base);
    d.setDate(d.getDate() + i);
    days.push(d);
  }
  const container = document.getElementById("agenda-content");
  const hours = getHours().filter(h => parseInt(h) >= 8);
  const header = `<div class="sched-row sched-header">
    <div class="sched-time"></div>
    ${CONFIG.canchas.map(c => `<div class="sched-court-label">${c.nombre}</div>`).join("")}
  </div>`;

  container.innerHTML = days.map(d => {
    const fKey  = d.toISOString().split("T")[0];
    const label = d.toLocaleDateString("es-AR", { weekday:"long", day:"numeric", month:"long" });
    const dayB  = bookings.filter(b => b.fecha === fKey && b.estado !== "cancelled");
    const rows = hours.map(h => {
      const slots = CONFIG.canchas.map(c => {
        const b = dayB.find(x => x.cancha === c.nombre && x.hora === h);
        return b
          ? `<div class="sched-slot occupied"><div class="player">${b.nombre}</div><div class="court-tag">${b.hora}</div></div>`
          : `<div class="sched-slot free">libre</div>`;
      }).join("");
      return `<div class="sched-row"><div class="sched-time">${h}</div>${slots}</div>`;
    }).join("");
    return `<div class="sched-day">${label}</div>${header}${rows}`;
  }).join("");
}