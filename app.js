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

  const pic = (it, cls = "") => it.image
    ? `<img src="${img(it.image)}" alt="${esc(it.name)}" loading="lazy" class="${cls}">`
    : `<div class="ph ${cls}"><span>${esc(it.name.split("·")[0])}</span></div>`;
  const priceTag = it => `<span class="price-s">${it.tags.includes("f") ? "<small>FROM</small>" : ""}${tk(it.price)}</span>`;
  const badges = it => [
    it.tags.includes("p") ? `<span class="b b-p">🔥 Popular</span>` : "",
    it.tags.includes("n") ? `<span class="b b-n">✨ New</span>` : "",
    it.tags.includes("s") ? `<span class="b b-s">🌶 Spicy</span>` : "",
  ].join("");

  // ---------- cart ----------
  let cart = {};
  try { cart = JSON.parse(localStorage.getItem("bx-cart") || "{}") || {}; } catch (e) {}
  Object.keys(cart).forEach(k => { if (!ITEMS[k]) delete cart[k]; });
  const save = () => { try { localStorage.setItem("bx-cart", JSON.stringify(cart)); } catch (e) {} };
  const count = () => Object.values(cart).reduce((a, b) => a + b, 0);
  const sub = () => Object.entries(cart).reduce((a, [k, q]) => a + ITEMS[k].price * q, 0);

  function add(id, srcImg) {
    cart[id] = (cart[id] || 0) + 1; save(); sync();
    toast(`+1 ${ITEMS[id].name}`);
    fly(srcImg);
    const p = $("#cartPill"); p.classList.remove("bump"); void p.offsetWidth; p.classList.add("bump");
  }
  function setQ(id, q) { if (q <= 0) delete cart[id]; else cart[id] = q; save(); sync(); }

  function sync() {
    const n = count(), s = sub();
    $("#pillCount").textContent = n;
    $("#barCount").textContent = n + (n === 1 ? " item" : " items");
    $("#barTotal").textContent = tk(s);
    const bar = $("#bar"); bar.hidden = !n; bar.classList.toggle("has", n > 0);
    $("#sub").textContent = tk(s);
    $("#tot").textContent = tk(n ? s + DELIVERY_FEE : 0);
    $("#wa").disabled = !n;
    $("#cartItems").innerHTML = n ? Object.entries(cart).map(([k, q]) => {
      const it = ITEMS[k];
      return `<div class="ci">${it.image ? `<img src="${img(it.image)}" alt="">` : `<div class="ci-ph"></div>`}
        <div class="ci-n"><b>${esc(it.name)}</b><span>${tk(it.price * q)}</span></div>
        <div class="qty"><button data-q="${k}" data-d="-1" aria-label="Less">−</button><span>${q}</span><button data-q="${k}" data-d="1" aria-label="More">+</button></div></div>`;
    }).join("") : `<div class="empty-cart"><div>🍔</div>Your tray is empty.<br>Tap <b>Add</b> on anything tasty.</div>`;
    $$("[data-add]").forEach(b => {
      const q = cart[b.dataset.add];
      if (b.closest(".lab")) return;
      b.classList.toggle("done", !!q);
      b.innerHTML = q ? `✓ ${q} in order` : "+ Add";
    });
  }
  $("#cartItems").addEventListener("click", e => {
    const b = e.target.closest("[data-q]"); if (b) setQ(b.dataset.q, (cart[b.dataset.q] || 0) + +b.dataset.d);
  });

  // ---------- deals ----------
  const D = ITEMS["super-charger"];
  $("#coupon").innerHTML = `<div class="cut"></div>
    <div><span class="kick">★ BUNDLE DEAL ★</span><h3>${esc(D.name)}</h3><p>${esc(D.desc)}</p>
    <span class="price">${tk(D.price)}</span><br><button class="add" data-add="${D.id}">+ Add</button></div>
    <img src="${img(D.image)}" alt="${esc(D.name)}">`;
  $("#hot").innerHTML = ["pro-max-pack", "rb-crispy", "cm-chicken"].map(id => {
    const it = ITEMS[id];
    return `<article class="hc">${pic(it)}<div class="hc-b"><h4>${esc(it.name)}</h4><div class="hc-r">${priceTag(it)}<button class="add" data-add="${id}">+ Add</button></div></div></article>`;
  }).join("");

  // ---------- rail ----------
  const order = [...cats.slice(0, 4), { id: "wings", name: "Wing Lab", icon: "🔥", items: [] }, ...cats.slice(4)];
  $("#rail").innerHTML = order.map(c => `<a href="#${c.id === "wings" ? "wings" : "c-" + c.id}" data-cat="${c.id}"><span class="ic">${c.icon}</span>${c.name}<span class="ct">${c.id === "wings" ? 6 : c.items.length}</span></a>`).join("");

  // ---------- wing lab ----------
  let wf = "peri", ws = 4;
  const labHTML = () => `<section class="lab" id="wings" data-cat="wings">
      <div class="lab-img"><img id="labImg" src="${img("peri-wings")}" alt="Wings"></div>
      <div>
        <span class="sticker s-yellow">🔥 WING LAB</span>
        <h3 style="margin-top:14px">Pick a flavour.<br>Pick a size.</h3>
        <p class="lab-d" id="labDesc"></p>
        <div class="lab-l">FLAVOUR</div>
        <div class="flv">${wings.flavours.map(([fid, , name, , heat]) => `<button data-wf="${fid}">${name}${heat ? `<span class="heat">${"🌶".repeat(heat)}</span>` : ""}</button>`).join("")}</div>
        <div class="lab-l">SIZE</div>
        <div class="sizes">${wings.sizes.map(s => `<button data-ws="${s.pcs}"><b>${s.pcs} PCS</b><span>${tk(s.price)}</span></button>`).join("")}</div>
        <div class="lab-r"><span class="price-s" id="labPrice"></span><button class="add" id="labAdd" data-add="">+ Add to order</button></div>
      </div></section>`;
  function updLab(swap) {
    const f = wings.flavours.find(x => x[0] === wf), s = wings.sizes.find(x => x.pcs === ws);
    $$("[data-wf]").forEach(b => b.classList.toggle("on", b.dataset.wf === wf));
    $$("[data-ws]").forEach(b => b.classList.toggle("on", +b.dataset.ws === ws));
    $("#labDesc").textContent = f[3];
    $("#labPrice").textContent = tk(s.price);
    $("#labAdd").dataset.add = `w-${wf}-${ws}`;
    const im = $("#labImg");
    if (swap && im.getAttribute("src") !== img(f[1])) {
      im.classList.add("swap");
      setTimeout(() => { im.src = img(f[1]); im.classList.remove("swap"); }, 180);
    } else im.src = img(f[1]);
  }

  // ---------- sections ----------
  let filter = "all", query = "";
  const card = it => `<article class="card rise">
      <div class="card-img">${pic(it)}<div class="badges">${badges(it)}</div></div>
      <div class="card-b"><h4>${esc(it.name)}</h4><p>${esc(it.desc)}</p>
      <div class="card-r">${priceTag(it)}<button class="add" data-add="${it.id}">+ Add</button></div></div></article>`;
  function render() {
    const q = query.trim().toLowerCase();
    let shown = 0, html = "";
    order.forEach(c => {
      if (c.id === "wings") {
        const hit = !q || ("wings wing lab " + wings.flavours.map(f => f[2]).join(" ")).toLowerCase().includes(q);
        if ((filter === "all" || filter === "s") && hit) { html += labHTML(); shown++; }
        return;
      }
      const list = c.items.map(a => ITEMS[a[0]]).filter(it =>
        (filter === "all" || it.tags.includes(filter)) && (!q || (it.name + " " + it.desc + " " + c.name).toLowerCase().includes(q)));
      if (!list.length) return;
      shown += list.length;
      html += `<section class="sec" id="c-${c.id}" data-cat="${c.id}"><div class="sec-h"><h3>${c.icon} ${c.name}</h3></div><p class="sec-b">${c.blurb}</p><div class="grid">${list.map(card).join("")}</div></section>`;
    });
    $("#sections").innerHTML = html;
    $("#empty").hidden = shown > 0;
    $$("#rail a").forEach(a => a.style.display = $(`[data-cat="${a.dataset.cat}"]`, $("#sections")) ? "" : "none");
    if ($("#labImg")) updLab(false);
    sync(); spy(); reveal();
  }
  $("#search").addEventListener("input", e => {
    query = e.target.value; render();
    if (query && scrollY < $("#menu").offsetTop - 200) $("#menu").scrollIntoView({ behavior: "smooth" });
  });
  $$(".f").forEach(b => b.onclick = () => { $$(".f").forEach(x => x.classList.toggle("on", x === b)); filter = b.dataset.f; render(); });

  // scrollspy
  let so;
  function spy() {
    so && so.disconnect();
    so = new IntersectionObserver(es => es.forEach(en => {
      if (!en.isIntersecting) return;
      $$("#rail a").forEach(a => {
        const on = a.dataset.cat === en.target.dataset.cat; a.classList.toggle("on", on);
        if (on && innerWidth <= 860) { const r = $("#rail"); r.scrollTo({ left: a.offsetLeft - r.clientWidth / 2 + a.clientWidth / 2, behavior: "smooth" }); }
      });
    }), { rootMargin: "-160px 0px -60% 0px" });
    $$("#sections [data-cat]").forEach(s => so.observe(s));
  }

  // entrance animations (cards pop in per row)
  let ro;
  function reveal() {
    ro && ro.disconnect();
    ro = new IntersectionObserver(es => es.forEach(en => {
      if (!en.isIntersecting) return;
      const el = en.target, sib = [...el.parentElement.children].indexOf(el);
      el.style.setProperty("--d", (sib % 3) * 0.07 + "s"); el.classList.add("in"); ro.unobserve(el);
    }), { threshold: .1 });
    $$(".rise:not(.in)").forEach(el => ro.observe(el));
  }

  // ---------- events ----------
  document.addEventListener("click", e => {
    const a = e.target.closest("[data-add]");
    if (a && a.dataset.add) { add(a.dataset.add, (a.closest(".card, .hc, .coupon, .lab") || document).querySelector("img")); return; }
    const f = e.target.closest("[data-wf]"); if (f) { wf = f.dataset.wf; updLab(true); return; }
    const s = e.target.closest("[data-ws]"); if (s) { ws = +s.dataset.ws; updLab(false); return; }
  });

  // drawer (≤1180px)
  const cartEl = $("#cart"), scrim = $("#scrim");
  const openCart = () => { if (innerWidth > 1180) { cartEl.animate([{ transform: "rotate(0)" }, { transform: "rotate(-1.5deg)" }, { transform: "rotate(1deg)" }, { transform: "rotate(0)" }], 400); return; } cartEl.classList.add("open"); scrim.hidden = false; document.body.style.overflow = "hidden"; };
  const closeCart = () => { cartEl.classList.remove("open"); scrim.hidden = true; document.body.style.overflow = ""; };
  $("#cartPill").onclick = openCart; $("#bar").onclick = openCart; $("#cartClose").onclick = closeCart; scrim.onclick = closeCart;
  addEventListener("keydown", e => { if (e.key === "Escape") closeCart(); });

  $("#wa").onclick = () => {
    const lines = Object.entries(cart).map(([k, q]) => `• ${q} × ${ITEMS[k].name}: ${tk(ITEMS[k].price * q)}`);
    const s = sub();
    const msg = `Hi Burger Xpress! I'd like to order:\n\n${lines.join("\n")}\n\nSubtotal: ${tk(s)}\nDelivery: ${tk(DELIVERY_FEE)}\n*Total: ${tk(s + DELIVERY_FEE)}*\n\nName:\nAddress:\nPhone:`;
    window.open(`${WHATSAPP_NUMBER ? "https://wa.me/" + WHATSAPP_NUMBER : "https://wa.me/"}?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
  };

  // ---------- toast + fly ----------
  let tt;
  function toast(t) { const el = $("#toast"); el.textContent = t; el.classList.add("show"); clearTimeout(tt); tt = setTimeout(() => el.classList.remove("show"), 1500); }
  function fly(src) {
    if (!src || !src.getBoundingClientRect) return;
    const target = $("#bar.has") && getComputedStyle($("#bar")).display !== "none" ? $("#bar") : $("#cartPill");
    const a = src.getBoundingClientRect(), b = target.getBoundingClientRect();
    if (!a.width || a.bottom < 0 || a.top > innerHeight) return;
    const g = src.cloneNode(); g.className = "ghost"; g.removeAttribute("loading");
    Object.assign(g.style, { left: a.left + "px", top: a.top + "px", width: a.width + "px", height: a.height + "px" });
    document.body.appendChild(g);
    const dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
    g.animate([
      { transform: "translate(0,0) scale(1) rotate(0)" },
      { transform: `translate(${dx * .4}px,${dy * .4 - 90}px) scale(.5) rotate(-20deg)`, offset: .5 },
      { transform: `translate(${dx}px,${dy}px) scale(.1) rotate(-60deg)`, opacity: .3 },
    ], { duration: 700, easing: "cubic-bezier(.5,0,.3,1)" }).onfinish = () => g.remove();
  }

  $("#yr").textContent = new Date().getFullYear();
  render();
  requestAnimationFrame(() => requestAnimationFrame(() => $(".hero").classList.add("in")));
})();
