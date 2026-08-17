const SITE = "https://islamic-pedia.vercel.app";
const ALADHAN = "https://api.aladhan.com/v1/timingsByCity";

const PRAYER_NAMES = {
  Fajr: "الفجر",
  Sunrise: "الشروق",
  Dhuhr: "الظهر",
  Asr: "العصر",
  Maghrib: "المغرب",
  Isha: "العشاء",
};
const ORDER = ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"];

const COUNTRIES = [
  { code: "Saudi Arabia", name: "السعودية", cities: ["Mecca", "Medina", "Riyadh", "Jeddah", "Dammam", "Abha", "Tabuk"] },
  { code: "Egypt", name: "مصر", cities: ["Cairo", "Alexandria", "Giza", "Aswan", "Luxor", "Tanta", "Port Said"] },
  { code: "United Arab Emirates", name: "الإمارات", cities: ["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Al Ain"] },
  { code: "Kuwait", name: "الكويت", cities: ["Kuwait City", "Hawalli", "Al Jahra"] },
  { code: "Qatar", name: "قطر", cities: ["Doha", "Al Rayyan", "Al Wakrah"] },
  { code: "Bahrain", name: "البحرين", cities: ["Manama", "Riffa", "Muharraq"] },
  { code: "Oman", name: "عُمان", cities: ["Muscat", "Salalah", "Sohar", "Nizwa"] },
  { code: "Yemen", name: "اليمن", cities: ["Sanaa", "Aden", "Taiz", "Hodeidah"] },
  { code: "Jordan", name: "الأردن", cities: ["Amman", "Zarqa", "Irbid", "Aqaba"] },
  { code: "Palestine", name: "فلسطين", cities: ["Jerusalem", "Gaza", "Hebron", "Nablus", "Ramallah"] },
  { code: "Syria", name: "سوريا", cities: ["Damascus", "Aleppo", "Homs", "Latakia"] },
  { code: "Lebanon", name: "لبنان", cities: ["Beirut", "Tripoli", "Sidon"] },
  { code: "Iraq", name: "العراق", cities: ["Baghdad", "Basra", "Mosul", "Erbil", "Najaf", "Karbala"] },
  { code: "Sudan", name: "السودان", cities: ["Khartoum", "Omdurman", "Port Sudan"] },
  { code: "Libya", name: "ليبيا", cities: ["Tripoli", "Benghazi", "Misrata"] },
  { code: "Tunisia", name: "تونس", cities: ["Tunis", "Sfax", "Sousse"] },
  { code: "Algeria", name: "الجزائر", cities: ["Algiers", "Oran", "Constantine", "Annaba"] },
  { code: "Morocco", name: "المغرب", cities: ["Casablanca", "Rabat", "Marrakesh", "Fes", "Tangier"] },
  { code: "Mauritania", name: "موريتانيا", cities: ["Nouakchott", "Nouadhibou"] },
  { code: "Somalia", name: "الصومال", cities: ["Mogadishu", "Hargeisa"] },
  { code: "Turkey", name: "تركيا", cities: ["Istanbul", "Ankara", "Izmir", "Bursa", "Konya"] },
  { code: "Pakistan", name: "باكستان", cities: ["Karachi", "Lahore", "Islamabad", "Peshawar"] },
  { code: "India", name: "الهند", cities: ["Delhi", "Mumbai", "Hyderabad", "Kolkata", "Chennai"] },
  { code: "Indonesia", name: "إندونيسيا", cities: ["Jakarta", "Surabaya", "Bandung", "Medan"] },
  { code: "Malaysia", name: "ماليزيا", cities: ["Kuala Lumpur", "Johor Bahru", "Penang"] },
  { code: "Bangladesh", name: "بنغلاديش", cities: ["Dhaka", "Chittagong", "Sylhet"] },
  { code: "Nigeria", name: "نيجيريا", cities: ["Lagos", "Kano", "Abuja"] },
  { code: "United Kingdom", name: "بريطانيا", cities: ["London", "Birmingham", "Manchester", "Leeds"] },
  { code: "France", name: "فرنسا", cities: ["Paris", "Marseille", "Lyon", "Lille"] },
  { code: "Germany", name: "ألمانيا", cities: ["Berlin", "Hamburg", "Munich", "Cologne"] },
  { code: "United States", name: "أمريكا", cities: ["New York", "Chicago", "Houston", "Los Angeles", "Detroit"] },
  { code: "Canada", name: "كندا", cities: ["Toronto", "Montreal", "Ottawa", "Calgary"] },
  { code: "Australia", name: "أستراليا", cities: ["Sydney", "Melbourne", "Perth"] },
];

const hijriEl = document.getElementById("hijri-date");
const timesEl = document.getElementById("prayer-times");
const nextLabel = document.getElementById("next-prayer-label");
const countdownEl = document.getElementById("countdown");
const placeEl = document.getElementById("prayer-place");

const settingsToggle = document.getElementById("settings-toggle");
const settingsBody = document.getElementById("settings-body");
const selCountry = document.getElementById("sel-country");
const selCity = document.getElementById("sel-city");
const selMethod = document.getElementById("sel-method");
const settingsSave = document.getElementById("settings-save");

let prayerTimes = null;
let countdownTimer = null;

function pad(n) { return String(n).padStart(2, "0"); }

function fmtTime(t) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const period = h < 12 ? "ص" : "م";
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${pad(m)} ${period}`;
}

function timeDiffStr(targetMs) {
  const diff = targetMs - Date.now();
  if (diff <= 0) return "00:00";
  const totalMin = Math.floor(diff / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  const s = Math.floor((diff % 60000) / 1000);
  if (h > 0) return `${pad(h)}:${pad(m)}`;
  return `${pad(m)}:${pad(s)}`;
}

function renderTimes(times) {
  timesEl.innerHTML = ORDER.map((k) => {
    const isNext = false;
    return `<div class="prayer-time" data-key="${k}">
      <span class="name">${PRAYER_NAMES[k]}</span>
      <span class="time">${fmtTime(times[k])}</span>
    </div>`;
  }).join("");
}

function startCountdown(times) {
  if (countdownTimer) clearInterval(countdownTimer);
  function tick() {
    const now = new Date();
    let nextPrayer = null;
    let nextKey = "";
    for (const k of ORDER) {
      if (k === "Sunrise") continue;
      const [h, m] = (times[k] || "").split(":").map(Number);
      const d = new Date(now);
      d.setHours(h, m, 0, 0);
      if (d.getTime() > now) { nextPrayer = d; nextKey = k; break; }
    }
    if (!nextPrayer) {
      const [h, m] = (times.Fajr || "").split(":").map(Number);
      nextPrayer = new Date(now);
      nextPrayer.setDate(nextPrayer.getDate() + 1);
      nextPrayer.setHours(h, m, 0, 0);
      nextKey = "Fajr";
    }
    nextLabel.textContent = PRAYER_NAMES[nextKey];
    countdownEl.textContent = timeDiffStr(nextPrayer.getTime());

    document.querySelectorAll(".prayer-time").forEach((el) => {
      el.classList.toggle("active", el.dataset.key === nextKey);
    });
  }
  tick();
  countdownTimer = setInterval(tick, 1000);
}

async function loadPrayerTimes() {
  try {
    const saved = await chrome.storage.local.get(["prayerCity", "prayerCountry", "prayerMethod"]);
    const city = saved.prayerCity || "Mecca";
    const country = saved.prayerCountry || "Saudi Arabia";
    const method = saved.prayerMethod || 4;
    placeEl.textContent = `${city} — ${country}`;

    const url = `${ALADHAN}?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=${method}`;
    const res = await fetch(url);
    const json = await res.json();
    if (!json?.data?.timings) throw new Error("no data");

    prayerTimes = json.data.timings;
    renderTimes(prayerTimes);
    startCountdown(prayerTimes);

    const h = json.data.date.hijri;
    hijriEl.textContent = `${h.day} ${h.month.ar} ${h.year}هـ — ${json.data.date.readable}`;
  } catch (e) {
    placeEl.textContent = "تعذّر جلب المواقيت";
    timesEl.innerHTML = "";
    hijriEl.textContent = "";
  }
}

// ─── Settings ───
function populateCountries(selectedCode) {
  selCountry.innerHTML = COUNTRIES.map((c) =>
    `<option value="${c.code}" ${c.code === selectedCode ? "selected" : ""}>${c.name}</option>`
  ).join("");
  populateCities(selectedCode);
}

function populateCities(countryCode, selectedCity) {
  const country = COUNTRIES.find((c) => c.code === countryCode);
  if (!country) return;
  selCity.innerHTML = country.cities.map((ct) =>
    `<option value="${ct}" ${ct === selectedCity ? "selected" : ""}>${ct}</option>`
  ).join("");
}

settingsToggle.addEventListener("click", () => {
  settingsBody.classList.toggle("open");
  settingsToggle.textContent = settingsBody.classList.contains("open") ? "✕ إخفاء" : "⚙ تغيير الموقع";
});

placeEl.addEventListener("click", () => {
  settingsBody.classList.add("open");
  settingsToggle.textContent = "✕ إخفاء";
});

selCountry.addEventListener("change", () => {
  populateCities(selCountry.value);
});

settingsSave.addEventListener("click", async () => {
  const city = selCity.value;
  const country = selCountry.value;
  const method = parseInt(selMethod.value);
  await chrome.storage.local.set({ prayerCity: city, prayerCountry: country, prayerMethod: method });
  settingsBody.classList.remove("open");
  settingsToggle.textContent = "⚙ تغيير الموقع";
  loadPrayerTimes();
});

async function loadSettings() {
  const saved = await chrome.storage.local.get(["prayerCity", "prayerCountry", "prayerMethod"]);
  const country = saved.prayerCountry || "Saudi Arabia";
  const city = saved.prayerCity || "Mecca";
  const method = saved.prayerMethod || 4;

  selMethod.value = method;
  populateCountries(country);
  selCity.value = city;
}

// ─── Tasbih ───
const tasbihDisplay = document.getElementById("tasbih-display");
const tasbihBtn = document.getElementById("tasbih-btn");
const tasbihReset = document.getElementById("tasbih-reset");
const tasbihTarget = document.getElementById("tasbih-target");
let tasbihCount = 0;

async function loadTasbih() {
  const data = await chrome.storage.local.get(["tasbihCount"]);
  tasbihCount = data.tasbihCount || 0;
  tasbihDisplay.textContent = tasbihCount;
}
async function saveTasbih() {
  await chrome.storage.local.set({ tasbihCount });
}

tasbihBtn.addEventListener("click", () => {
  const target = parseInt(tasbihTarget.value) || 0;
  if (target > 0 && tasbihCount >= target) {
    tasbihBtn.textContent = "✓ تمّ";
    tasbihBtn.style.opacity = "0.6";
    return;
  }
  tasbihCount++;
  tasbihDisplay.textContent = tasbihCount;
  saveTasbih();
  if (target > 0 && tasbihCount >= target) {
    tasbihBtn.textContent = "✓ تمّ";
    tasbihBtn.style.opacity = "0.6";
    try { navigator.vibrate?.(50); } catch(_){}
  }
});

tasbihReset.addEventListener("click", () => {
  tasbihCount = 0;
  tasbihDisplay.textContent = "0";
  tasbihBtn.textContent = "سبّح";
  tasbihBtn.style.opacity = "1";
  saveTasbih();
});

// Keyboard space = tasbih
document.addEventListener("keydown", (e) => {
  if (e.code === "Space" && e.target === document.body) {
    e.preventDefault();
    tasbihBtn.click();
  }
});

// ─── Init ───
loadSettings();
loadPrayerTimes();
loadTasbih();
