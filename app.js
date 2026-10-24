const API_URL = "http://127.0.0.1:8000/api";
// Якщо в urls.py адреси зі слешем (cats/), змініть на "/" нижче
const SLASH = "";

const STATUS_LABELS = {
  available: "Доступний",
  reserved: "Зарезервований",
  sold: "Проданий",
};

const $ = (id) => document.getElementById(id);

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value ?? "";
  return div.innerHTML;
}

async function api(path) {
  const response = await fetch(`${API_URL}${path}`);
  if (!response.ok) {
    let text = `Помилка ${response.status}`;
    try {
      const body = await response.json();
      if (body.message) text = body.message;
      else if (body.detail) text = body.detail;
    } catch (e) {}
    throw new Error(text);
  }
  return response.json();
}

// ---------- Коти ----------

async function loadBreeds() {
  try {
    const breeds = await api(`/breeds${SLASH}`);
    $("filter-breed").innerHTML =
      `<option value="">Усі породи</option>` +
      breeds.map((b) => `<option value="${b.id}">${escapeHtml(b.name)}</option>`).join("");
  } catch (err) {
    console.error("Не вдалося завантажити породи:", err.message);
  }
}

async function loadCats() {
  const message = $("cats-message");
  const container = $("cats");
  message.textContent = "Завантаження...";
  container.innerHTML = "";

  const params = new URLSearchParams();
  params.set("limit", "100"); // максимум, дозволений бекендом
  if ($("filter-breed").value) params.set("breed_id", $("filter-breed").value);
  if ($("filter-status").value) params.set("status", $("filter-status").value);
  if ($("filter-search").value.trim()) params.set("search", $("filter-search").value.trim());
  const query = `?${params}`;

  try {
    const data = await api(`/cats${SLASH}${query}`);
    const cats = data.items ?? data; // працює і з пагінацією, і зі звичайним масивом
    message.textContent = cats.length ? "" : "Котів за цими умовами не знайдено.";
    container.innerHTML = cats
      .map(
        (cat) => `
        <article class="card" data-id="${cat.id}" tabindex="0">
          <img src="${escapeHtml(cat.photo_url)}" alt="${escapeHtml(cat.name)}">
          <h3>${escapeHtml(cat.name)}</h3>
          <p>${escapeHtml(cat.breed.name)}</p>
          <p class="price">${cat.price} грн</p>
          <p class="status ${cat.status}">${STATUS_LABELS[cat.status] ?? cat.status}</p>
        </article>`
      )
      .join("");
  } catch (err) {
    message.textContent = `Не вдалося завантажити котів: ${err.message}`;
  }
}

async function openCat(id) {
  const details = $("cat-details");
  details.textContent = "Завантаження...";
  $("cat-dialog").showModal();
  try {
    const cat = await api(`/cats/${id}${SLASH}`);
    details.innerHTML = `
      <img src="${escapeHtml(cat.photo_url)}" alt="${escapeHtml(cat.name)}">
      <h2>${escapeHtml(cat.name)}</h2>
      <p>Порода: ${escapeHtml(cat.breed.name)}</p>
      <p>Стать: ${cat.sex === "female" ? "кішка" : "кіт"}</p>
      <p>Дата народження: ${escapeHtml(cat.birth_date)}</p>
      <p>Ціна: ${cat.price} грн</p>
      <p>Статус: ${STATUS_LABELS[cat.status] ?? cat.status}</p>
      <p>Заводчик: ${escapeHtml(cat.breeder.name)}${cat.breeder.city ? ", " + escapeHtml(cat.breeder.city) : ""}</p>
      <p>${escapeHtml(cat.description)}</p>`;
  } catch (err) {
    details.textContent = `Не вдалося завантажити кота: ${err.message}`;
  }
}

// ---------- Заводчики ----------

async function loadBreeders() {
  const message = $("breeders-message");
  const container = $("breeders");
  message.textContent = "Завантаження...";
  try {
    const breeders = await api(`/breeders${SLASH}`);
    message.textContent = breeders.length ? "" : "Заводчиків поки немає.";
    container.innerHTML = breeders
      .map(
        (b) => `
        <article class="card" data-id="${b.id}" tabindex="0">
          <h3>${escapeHtml(b.name)}</h3>
          <p>${escapeHtml(b.country)}${b.city ? ", " + escapeHtml(b.city) : ""}</p>
        </article>`
      )
      .join("");
  } catch (err) {
    message.textContent = `Не вдалося завантажити заводчиків: ${err.message}`;
  }
}

async function openBreeder(id) {
  const details = $("breeder-details");
  details.textContent = "Завантаження...";
  $("breeder-dialog").showModal();
  try {
    const b = await api(`/breeders/${id}${SLASH}`);
    const phone = b.phone
      ? `<p>Телефон: <a href="tel:${escapeHtml(b.phone)}">${escapeHtml(b.phone)}</a></p>`
      : "";
    const email = b.email
      ? `<p>Email: <a href="mailto:${escapeHtml(b.email)}">${escapeHtml(b.email)}</a></p>`
      : "";

    const cats = (b.cats ?? [])
      .map(
        (cat) => `
        <article class="card" data-cat-id="${cat.id}" tabindex="0">
          <img src="${escapeHtml(cat.photo_url)}" alt="${escapeHtml(cat.name)}">
          <h3>${escapeHtml(cat.name)}</h3>
          ${cat.breed ? `<p>${escapeHtml(cat.breed.name)}</p>` : ""}
          <p class="price">${cat.price} грн</p>
          <p class="status ${cat.status}">${STATUS_LABELS[cat.status] ?? cat.status}</p>
        </article>`
      )
      .join("");

    details.innerHTML = `
      <h2>${escapeHtml(b.name)}</h2>
      <p>Країна: ${escapeHtml(b.country)}</p>
      ${b.city ? `<p>Місто: ${escapeHtml(b.city)}</p>` : ""}
      ${phone}
      ${email}
      ${b.description ? `<p>${escapeHtml(b.description)}</p>` : ""}
      <h3 class="section-title">Коти заводчика (${(b.cats ?? []).length})</h3>
      ${cats ? `<div class="grid">${cats}</div>` : `<p class="message">Поки немає котів.</p>`}`;
  } catch (err) {
    details.textContent = `Не вдалося завантажити заводчика: ${err.message}`;
  }
}

// ---------- Події ----------

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t === tab));
    const view = tab.dataset.view;
    $("view-cats").hidden = view !== "cats";
    $("view-breeders").hidden = view !== "breeders";
    if (view === "breeders") loadBreeders();
  });
});

$("filter-apply").addEventListener("click", loadCats);
$("filter-search").addEventListener("keydown", (e) => {
  if (e.key === "Enter") loadCats();
});

$("cats").addEventListener("click", (e) => {
  const card = e.target.closest(".card");
  if (card) openCat(card.dataset.id);
});
$("cats").addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const card = e.target.closest(".card");
    if (card) openCat(card.dataset.id);
  }
});

$("breeders").addEventListener("click", (e) => {
  const card = e.target.closest(".card");
  if (card) openBreeder(card.dataset.id);
});
$("breeders").addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const card = e.target.closest(".card");
    if (card) openBreeder(card.dataset.id);
  }
});

// Клік на кота у вікні заводчика: закрити це вікно й відкрити кота
function openCatFromBreeder(e) {
  const card = e.target.closest("[data-cat-id]");
  if (!card) return;
  $("breeder-dialog").close();
  openCat(card.dataset.catId);
}
$("breeder-details").addEventListener("click", openCatFromBreeder);
$("breeder-details").addEventListener("keydown", (e) => {
  if (e.key === "Enter") openCatFromBreeder(e);
});

$("dialog-close").addEventListener("click", () => $("cat-dialog").close());
$("breeder-dialog-close").addEventListener("click", () => $("breeder-dialog").close());

loadBreeds();
loadCats();