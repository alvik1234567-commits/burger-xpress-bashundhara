(() => {
  // ---- Settings: restaurant WhatsApp number (country code, no +), e.g. "8801712345678"
  const WHATSAPP_NUMBER = "";
  const DELIVERY_FEE = 29;

  const { cats, wings, deal } = window.BX;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const tk = n => "Tk " + n.toLocaleString("en-IN");
  const img = f => `img/menu/${f}.jpg`;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  // ---------- catalogue ----------
  const ITEMS = {};
  const mk = (a, cat) => { const [id, image, name, price, desc, tags] = a; return ITEMS[id] = { id, image, name, price, desc, tags: tags.split(" ").filter(Boolean), cat }; };
  cats.forEach(c => c.items.forEach(a => mk(a, c.id)));
  mk(deal, "deal");
  wings.flavours.forEach(([fid, image, name, desc, heat]) => wings.sizes.forEach(s => {
    ITEMS[`w-${fid}-${s.pcs}`] = { id: `w-${fid}-${s.pcs}`, image, name: `${name} Wings · ${s.pcs} pcs`, price: s.price, desc, tags: heat ? ["s"] : [], cat: "wings" };
  }));
  $("#dishCount").textContent = cats.reduce((a, c) => a + c.items.length, 0);

  const pic = it => it.image
    ? `<img src="${img(it.image)}" alt="${esc(it.name)}" loading="lazy">`
    : `<div class="ph"><img src="img/logo-lg.png" alt=""></div>`;
  const price = it => `<span class="price">${it.tags.includes("f") ? "<small>FROM</small>" : ""}${tk(it.price)}</span>`;
  const tags = it => [
    it.tags.includes("p") ? `<span class="tg tg-p">Bestseller</span>` : "",
    it.tags.includes("n") ? `<span class="tg tg-n">New</span>` : "",
    it.tags.includes("s") ? `<span class="tg tg-s">🌶 Spicy</span>` : "",
  ].join("");

  // ---------- cart ----------
  let cart = {};
  try { cart = JSON.parse(localStorage.getItem("bx-cart") || "{}") || {}; } catch (e) {}
  Object.keys(cart).forEach(k => { if (!ITEMS[k]) delete cart[k]; });
  const save = () => { try { localStorage.setItem("bx-cart", JSON.stringify(cart)); } catch (e) {} };
  const count = () => Object.values(cart).reduce((a, b) => a + b, 0);
  const sub = () => Object.entries(cart).reduce((a, [k, q]) => a + ITEMS[k].price * q, 0);

  function add(id, src) {
    cart[id] = (cart[id] || 0) + 1; save(); sync();
    toast(`Added ${ITEMS[id].name}`); fly(src);
    const b = $("#cartOpen"); b.classList.remove("bump"); void b.offsetWidth; b.classList.add("bump");
  }
  const setQ = (id, q) => { if (q <= 0) delete cart[id]; else cart[id] = q; save(); sync(); };

  function sync() {
    const n = count(), s = sub();
    $("#count").textContent = n;
    $("#fabCount").textContent = n + (n === 1 ? " item" : " items");
    $("#fabTotal").textContent = tk(s);
    const fab = $("#fab"); fab.hidden = false; fab.classList.toggle("show", n > 0 && !$("#drawer").classList.contains("open"));
    $("#sub").textContent = tk(s);
    $("#tot").textContent = tk(n ? s + DELIVERY_FEE : 0);
    $("#wa").disabled = !n;
    $("#items").innerHTML = n ? Object.entries(cart).map(([k, q]) => {
      const it = ITEMS[k];
      return `<div class="ci"><img class="ci-img" src="${it.image ? img(it.image) : "img/logo-lg.png"}" alt="">
        <div class="ci-n"><b>${esc(it.name)}</b><span>${tk(it.price * q)}</span></div>
        <div class="qty"><button data-q="${k}" data-d="-1" aria-label="Less">−</button><span>${q}</span><button data-q="${k}" data-d="1" aria-label="More">+</button></div></div>`;
    }).join("") : `<div class="d-empty"><img src="img/logo-lg.png" alt="">Nothing here yet.<br>Add something hot from the menu.</div>`;
    $$(".add[data-add]").forEach(b => { const q = cart[b.dataset.add]; b.classList.toggle("in", !!q); b.textContent = q ? "×" + q : "+"; });
  }
  $("#items").addEventListener("click", e => { const b = e.target.closest("[data-q]"); if (b) setQ(b.dataset.q, (cart[b.dataset.q] || 0) + +b.dataset.d); });

  // ---------- bestsellers ----------
  const best = ["chicken-cheese", "pro-pack", "rb-crispy", "cm-chicken", "rb-sizzling", "pro-max-pack"];
  $("#bestRow").innerHTML = best.map((id, i) => { const it = ITEMS[id]; return `
    <article class="bs rise"><img src="${img(it.image)}" alt="${esc(it.name)}"><span class="bs-n">#${i + 1}</span>
      <div class="bs-b"><div><h3>${esc(it.name)}</h3><span class="p">${it.tags.includes("f") ? "from " : ""}${tk(it.price)}</span></div>
      <button class="add" data-add="${id}" aria-label="Add ${esc(it.name)}">+</button></div></article>`; }).join("");
  $$("[data-scroll]").forEach(b => b.onclick = () => { const r = $("#bestRow"); r.scrollBy({ left: +b.dataset.scroll * r.clientWidth * 0.8, behavior: "smooth" }); });

  // ---------- deal ----------
  const D = ITEMS["super-charger"];
  $("#deal").innerHTML = `<div style="position:relative"><span class="deal-tag">BUNDLE DEAL</span><h3>${esc(D.name)}</h3><p>${esc(D.desc)}</p>
    <div class="deal-r"><span class="deal-price">${tk(D.price)}</span><button class="lab-add" data-add="${D.id}">Add to order</button></div></div>
    <img src="${img(D.image)}" alt="${esc(D.name)}">`;

  // ---------- wing lab ----------
  let wf = "peri", ws = 4;
  $("#lab").innerHTML = `<div class="lab-img"><img id="labImg" src="${img("peri-wings")}" alt="Wings"></div>
    <div class="lab-c"><p class="kicker">Wing Lab</p><h2>Pick your flavour</h2><p class="lab-d" id="labDesc"></p>
      <div class="lab-l">FLAVOUR</div>
      <div class="flv">${wings.flavours.map(([fid, , name, , heat]) => `<button data-wf="${fid}">${name}<small>${heat ? "🌶".repeat(heat) : "Mild"}</small></button>`).join("")}</div>
      <div class="lab-l">SIZE</div>
      <div class="sizes">${wings.sizes.map(s => `<button data-ws="${s.pcs}"><b>${s.pcs} pieces</b><span>${tk(s.price)}</span></button>`).join("")}</div>
      <div class="lab-r"><span class="lab-price" id="labPrice"></span><button class="lab-add" id="labAdd" data-add="">Add to order</button></div></div>`;
  function updLab(swap) {
    const f = wings.flavours.find(x => x[0] === wf), s = wings.sizes.find(x => x.pcs === ws);
    $$("[data-wf]").forEach(b => b.classList.toggle("on", b.dataset.wf === wf));
    $$("[data-ws]").forEach(b => b.classList.toggle("on", +b.dataset.ws === ws));
    $("#labDesc").textContent = f[3];
    $("#labPrice").textContent = tk(s.price);
    $("#labAdd").dataset.add = `w-${wf}-${ws}`;
    const im = $("#labImg");
    if (swap && im.getAttribute("src") !== img(f[1])) { im.classList.add("swap"); setTimeout(() => { im.src = img(f[1]); im.classList.remove("swap"); }, 180); }
    else im.src = img(f[1]);
  }
  updLab(false);

  // ---------- menu ----------
  $("#tabs").innerHTML = cats.map(c => `<a class="tab" href="#c-${c.id}" data-cat="${c.id}">${c.name}</a>`).join("");
  let query = "";
  const card = it => `<article class="card rise"><div class="card-img">${pic(it)}<div class="tags">${tags(it)}</div></div>
    <div class="card-b"><h4>${esc(it.name)}</h4><p>${esc(it.desc)}</p><div class="card-r">${price(it)}<button class="add" data-add="${it.id}" aria-label="Add ${esc(it.name)}">+</button></div></div></article>`;
  function render() {
    const q = query.trim().toLowerCase(); let shown = 0;
    $("#sections").innerHTML = cats.map(c => {
      const list = c.items.map(a => ITEMS[a[0]]).filter(it => !q || (it.name + " " + it.desc + " " + c.name).toLowerCase().includes(q));
      if (!list.length) return "";
      shown += list.length;
      return `<section class="cat" id="c-${c.id}" data-cat="${c.id}"><div class="cat-h"><h3>${c.name}</h3><span>${list.length}</span></div><p class="cat-b">${c.blurb}</p><div class="grid">${list.map(card).join("")}</div></section>`;
    }).join("");
    $("#empty").hidden = shown > 0;
    $$(".tab").forEach(t => t.style.display = $("#c-" + t.dataset.cat) ? "" : "none");
    sync(); spy(); reveal();
  }
  $("#search").addEventListener("input", e => { query = e.target.value; render(); });

  let so;
  function spy() {
    so && so.disconnect();
    so = new IntersectionObserver(es => es.forEach(en => {
      if (!en.isIntersecting) return;
      $$(".tab").forEach(t => { const on = t.dataset.cat === en.target.dataset.cat; t.classList.toggle("on", on);
        if (on) { const r = $("#tabs"); r.scrollTo({ left: t.offsetLeft - r.clientWidth / 2 + t.clientWidth / 2, behavior: "smooth" }); } });
    }), { rootMargin: "-150px 0px -60% 0px" });
    $$(".cat").forEach(s => so.observe(s));
  }
  let ro;
  function reveal() {
    ro && ro.disconnect();
    ro = new IntersectionObserver(es => es.forEach(en => {
      if (!en.isIntersecting) return;
      const el = en.target; el.style.setProperty("--d", ([...el.parentElement.children].indexOf(el) % 4) * 0.06 + "s");
      el.classList.add("in"); ro.unobserve(el);
    }), { threshold: .08 });
    $$(".rise:not(.in)").forEach(el => ro.observe(el));
  }

  // ---------- events ----------
  document.addEventListener("click", e => {
    const a = e.target.closest("[data-add]");
    if (a && a.dataset.add) { add(a.dataset.add, (a.closest(".card, .bs, .deal, .lab") || document).querySelector("img")); return; }
    const f = e.target.closest("[data-wf]"); if (f) { wf = f.dataset.wf; updLab(true); return; }
    const s = e.target.closest("[data-ws]"); if (s) { ws = +s.dataset.ws; updLab(false); }
  });
  const drawer = $("#drawer"), scrim = $("#scrim");
  const openCart = () => { drawer.classList.add("open"); drawer.setAttribute("aria-hidden", "false"); scrim.hidden = false; document.body.style.overflow = "hidden"; sync(); };
  const closeCart = () => { drawer.classList.remove("open"); drawer.setAttribute("aria-hidden", "true"); scrim.hidden = true; document.body.style.overflow = ""; sync(); };
  $("#cartOpen").onclick = openCart; $("#fab").onclick = openCart; $("#cartClose").onclick = closeCart; scrim.onclick = closeCart;
  addEventListener("keydown", e => { if (e.key === "Escape") closeCart(); });

  $("#wa").onclick = () => {
    const lines = Object.entries(cart).map(([k, q]) => `• ${q} × ${ITEMS[k].name}: ${tk(ITEMS[k].price * q)}`);
    const s = sub();
    const msg = `Hi Burger Xpress! I'd like to order:\n\n${lines.join("\n")}\n\nSubtotal: ${tk(s)}\nDelivery: ${tk(DELIVERY_FEE)}\n*Total: ${tk(s + DELIVERY_FEE)}*\n\nName:\nAddress:\nPhone:`;
    window.open(`${WHATSAPP_NUMBER ? "https://wa.me/" + WHATSAPP_NUMBER : "https://wa.me/"}?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
  };

  let tt;
  function toast(t) { const el = $("#toast"); el.textContent = "✓ " + t; el.classList.add("show"); clearTimeout(tt); tt = setTimeout(() => el.classList.remove("show"), 1500); }
  function fly(src) {
    if (!src || !src.getBoundingClientRect) return;
    const fab = $("#fab"), target = fab.classList.contains("show") && innerWidth < 860 ? fab : $("#cartOpen");
    const a = src.getBoundingClientRect(), b = target.getBoundingClientRect();
    if (!a.width || a.bottom < 0 || a.top > innerHeight) return;
    const g = src.cloneNode(); g.className = "ghost"; g.removeAttribute("loading");
    const w = Math.min(a.width, 160), h = Math.min(a.height, 160);
    Object.assign(g.style, { left: a.left + (a.width - w) / 2 + "px", top: a.top + (a.height - h) / 2 + "px", width: w + "px", height: h + "px" });
    document.body.appendChild(g);
    const dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
    g.animate([{ transform: "translate(0,0) scale(1)" }, { transform: `translate(${dx * .5}px,${dy * .5 - 80}px) scale(.55)`, offset: .55 }, { transform: `translate(${dx}px,${dy}px) scale(.12)`, opacity: .2 }],
      { duration: 700, easing: "cubic-bezier(.5,0,.3,1)" }).onfinish = () => g.remove();
  }

  // ---------- branches (from foodpanda listings) ----------
  const BRANCHES = [
    ["Bashundhara", "492 Apollo Hospital Road (beside Auto Xpress), Vatara", 23.80835627, 90.42946557],
    ["Baily Road", "1 New Baily Road", 23.7418792, 90.4107042],
    ["Banani", "House 33, Road 17, Block E, Abdul Alim Nakib Road (behind Banani kacha bazar)", 23.79286059, 90.40787773],
    ["Dhanmondi", "2 Circular Road, beside Kalabagan Thana, opposite Dhanmondi Jame Masjid", 23.743216, 90.388077],
    ["Sukrabad", "95 Sukrabad, Dhanmondi (opposite Lalbag Biryani)", 23.7529433, 90.378131],
    ["Mirpur 10", "House 1, Lane 4, Block B, Section 10, Mirpur (beside Nanna Biryani)", 23.8095725, 90.3704625],
    ["Shewrapara", "265/1 West Shewrapara, by Metro Rail pillar 320", 23.7886336, 90.3764574],
    ["Mohammadpur", "House Y, 8 Noorjahan Road (near Mohammadpur Girls' High School)", 23.76230335, 90.3613271],
    ["Uttara 14", "ShamsunNehar Tower, 1st floor, 71 Gausul Azam Avenue, Sector 14", 23.869175, 90.385868],
    ["Uttara 11", "Nurjahan Tower, House 24, Road 10/B, Sector 11 (lift 7)", 23.87882465, 90.39088945],
    ["Wari", "Kurban Ali Plaza, 3rd floor, 4 Hare Street, Wari", 23.7182147, 90.41645535],
  ];
  $("#brCount").textContent = BRANCHES.length;
  $("#branches").innerHTML = BRANCHES.map(([n, a], i) =>
    `<li><button data-br="${i}" class="${i ? "" : "on"}"><b>${esc(n)}${i ? "" : '<em class="here">YOU\'RE HERE</em>'}</b><span>${esc(a)}</span></button></li>`).join("");
  $("#branches").addEventListener("click", e => {
    const b = e.target.closest("[data-br]"); if (!b) return;
    const [n, a, lat, lng] = BRANCHES[+b.dataset.br];
    $$("#branches button").forEach(x => x.classList.toggle("on", x === b));
    $("#brName").textContent = n; $("#brAddr").textContent = a;
    $("#brDir").href = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    $("#mapFrame").src = `https://www.google.com/maps?q=${lat},${lng}&z=16&output=embed`;
    if (innerWidth < 860) $(".br-map").scrollIntoView({ behavior: "smooth", block: "center" });
  });

  $("#yr").textContent = new Date().getFullYear();
  render();
  requestAnimationFrame(() => requestAnimationFrame(() => $(".hero").classList.add("in")));
})();
