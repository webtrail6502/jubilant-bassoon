(function(){
  const $ = id => document.getElementById(id);
  const esc = v => String(v == null ? "" : v).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  let rippled = false, members = null;
  async function open(role) {
    const adm = role === "admin";
    const box = $("rosterBox");
    box.classList.toggle("adm", adm);
    $("rsTitle").textContent = adm ? "Admin" : "Delivery";
    $("rosterModal").classList.remove("hidden");
    if (!rippled && window.RippleBG) { rippled = true; RippleBG.attach(box, { tone: "light", interval: 2400 }); }
    $("rsList").innerHTML = '<div class="empty">Loading...</div>';
    if (currentProfile) { $("rsCode").textContent = currentProfile.branch_code || "\u2014"; $("rsBranch").textContent = currentProfile.branch_name || "Your branch"; }
    if (!sb) { $("rsList").innerHTML = '<div class="empty">Supabase is not configured.</div>'; return; }
    if (!members) {
      const { data, error } = await sb.rpc("branch_members");
      if (error) { $("rsList").innerHTML = '<div class="empty">Could not load the list. Run team-setup.sql in Supabase first.</div>'; return; }
      members = data;
    }
    const list = members.filter(m => adm ? m.role === "admin" : m.role !== "admin");
    $("rsList").innerHTML = list.length
      ? list.map((m, i) => '<div class="rs-row"><span class="rs-n">' + (i + 1) + '</span><strong>' + esc(m.name) + '</strong>' + (m.is_me ? '<em>you</em>' : '') + '</div>').join("")
      : '<div class="empty">No ' + (adm ? "admin" : "delivery boys") + ' yet.</div>';
  }
  function close() { $("rosterModal").classList.add("hidden"); members = null; }
  $("rosterAdminBtn").onclick = () => open("admin");
  $("rosterDeliveryBtn").onclick = () => open("delivery");
  $("rosterClose").onclick = close;
  $("rosterModal").addEventListener("pointerdown", e => { if (e.target === $("rosterModal")) close(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape") close(); });
})();
document.getElementById("logoutBtn").onclick = () => { if (sb) sb.auth.signOut(); };

/* ---------- CHANGE PASSWORD (admin and delivery, while logged in - no email needed) ---------- */
document.getElementById("pwBtn").onclick = async () => {
  if (!sb || !currentUser) return;
  const p1 = prompt("Enter your new password (minimum 6 characters):");
  if (p1 === null) return;
  if (p1.length < 6) { alert("Password must be at least 6 characters."); return; }
  const p2 = prompt("Type the new password again to confirm:");
  if (p1 !== p2) { alert("Passwords do not match. Nothing was changed."); return; }
  const { error } = await sb.auth.updateUser({ password: p1 });
  alert(error ? "Could not change password: " + error.message : "Password changed. Use the new password next time you log in.");
};

const splash = document.getElementById("splash");
const logoBox = document.getElementById("logoBox");
logoBox.innerHTML =
  (LOGO_URL
    ? '<img class="logo-img" alt="" src="' + LOGO_URL + '"/>'
    : '<svg class="logo-img" viewBox="0 0 64 64" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22h40l-3 32H15L12 22z" fill="rgba(255,255,255,.15)"/><path d="M22 22v-4a10 10 0 0 1 20 0v4"/></svg>')
  + '<div class="logo-name">My Statement</div><div class="logo-tag">Daily collection &amp; payment tracker</div>';

function playSplash(mode, swapScreens){
  splash.style.animation = "none";
  logoBox.style.animation = "none";
  void splash.offsetWidth;
  splash.classList.add("show");
  const finish = () => { splash.classList.remove("show"); splash.style.animation = ""; logoBox.style.animation = ""; };
  const total = mode === "in" ? 3400 : 2800;
  splash.style.animation = "splashFadeIn .4s ease forwards";
  if (mode === "in") {
    logoBox.style.animation = "logoCinema " + (total / 1000) + "s cubic-bezier(.45,0,.35,1) forwards";
  } else {
    logoBox.style.animation = "logoCinemaRev " + (total / 1000) + "s cubic-bezier(.65,0,.55,1) forwards";
  }
  setTimeout(() => {
    swapScreens();
    splash.style.animation = "splashFadeOut .9s ease forwards";
    setTimeout(finish, 920);
  }, total - 900);
}

function playLogout(showLogin){
  const target = document.getElementById("loginLogo");
  const hasTarget = !!LOGO_URL && target;

  showLogin();
  if (!hasTarget) return;
  target.style.visibility = "hidden";

  splash.style.animation = "none";
  logoBox.style.animation = "none";
  splash.getAnimations().forEach(a => a.cancel());
  logoBox.getAnimations().forEach(a => a.cancel());
  logoBox.style.visibility = "hidden";
  splash.classList.add("show");

  const to = target.getBoundingClientRect();
  const fly = document.createElement("img");
  fly.src = LOGO_URL;
  fly.alt = "";
  fly.style.cssText = "position:fixed;z-index:10000;object-fit:contain;pointer-events:none;" +
    "left:" + to.left + "px;top:" + to.top + "px;width:" + to.width + "px;height:" + to.height + "px;" +
    "border-radius:22px;transform-origin:50% 50%;will-change:transform,opacity,filter";
  document.body.appendChild(fly);

  const dur = 1400;
  const ease = "cubic-bezier(.22,1,.36,1)";
  splash.animate([{opacity:1},{opacity:0}], {duration:dur, easing:"ease-out", fill:"forwards"});
  const fl = fly.animate([
    {transform:"scale(3.2)", opacity:0, filter:"blur(12px)",
     boxShadow:"0 0 0 6px rgba(255,255,255,.14),0 24px 60px rgba(255,159,0,.35)"},
    {transform:"scale(1)", opacity:1, filter:"blur(0)",
     boxShadow:"0 14px 34px rgba(60,0,60,.4),0 0 0 5px rgba(255,255,255,.95)"}
  ], {duration:dur, easing:ease, fill:"forwards"});
  fly.animate([{opacity:0},{opacity:1}], {duration:dur*0.35, easing:"ease-out", fill:"forwards"});

  fl.onfinish = () => {
    target.style.visibility = "";
    fly.remove();
    splash.getAnimations().forEach(a => a.cancel());
    splash.classList.remove("show");
    splash.style.animation = "";
    logoBox.style.animation = "";
    logoBox.style.visibility = "";
  };
}

/* ---------- APP STATE ---------- */
let statements = [];
let pending = [];
let denomHistory = [];
let wasLoggedIn = false;
let loadedUid = null;
const timers = {};
const later = (k, fn) => { clearTimeout(timers[k]); timers[k] = setTimeout(fn, 250); };

const rowToStmt = r => ({ id: r.id, person: r.person, date: r.date, collected: Number(r.collected), paid: Number(r.paid),
  balance: Number(r.balance), type: r.type, source: r.source, createdAt: Number(r.created_at) });
const rowToDen = r => ({ docId: r.id, id: r.id, rider: r.rider, date: r.date, notes: r.notes || {}, cash: Number(r.cash),
  phonepe: Number(r.phonepe), delivery: r.delivery, pickup: r.pickup, photo: r.photo, status: r.status,
  submitterName: r.submitter_name, createdAt: Number(r.created_at) });

async function refreshStatements(){
  if (!sb || !isAdmin) return;
  const { data, error } = await sb.from("statements").select("*").order("created_at", { ascending: false });
  if (error) { console.error(error.message); return; }
  statements = data.map(rowToStmt);
  render();
  updatePersonFields();
}
async function refreshPending(){
  if (!sb || !isAdmin) return;
  const { data, error } = await sb.from("denominations").select("*").in("status", ["pending", "pp_pending"]).order("created_at", { ascending: false });
  if (error) { console.error(error.message); return; }
  pending = data.map(rowToDen);
  renderPending();
}
async function refreshHistory(){
  if (!sb) return;
  const { data, error } = await sb.from("denominations")
    .select("id,rider,date,notes,cash,phonepe,delivery,pickup,status,submitter_name,created_at")
    .order("created_at", { ascending: false });
  if (error) { console.error(error.message); return; }
  denomHistory = data.map(rowToDen);
  renderHistory();
}

function startData(){
  stopData();
  refreshHistory();
  if (isAdmin) { refreshStatements(); refreshPending(); }
  rtChannel = sb.channel("live-" + currentUser.id);
  rtChannel.on("postgres_changes", { event: "*", schema: "public", table: "denominations" }, () => {
    later("h", refreshHistory);
    if (isAdmin) later("p", refreshPending);
  });
  if (isAdmin) rtChannel.on("postgres_changes", { event: "*", schema: "public", table: "statements" }, () => later("s", refreshStatements));
  rtChannel.subscribe();
}
function stopData(){
  if (rtChannel && sb) { sb.removeChannel(rtChannel); }
  rtChannel = null;
}

async function handleSession(session){
  if (session && session.user) {
    if (loadedUid === session.user.id) return;          /* token refresh etc. */
    loadedUid = session.user.id;
    currentUser = session.user;
    const { data: prof, error } = await sb.from("profiles").select("*").eq("id", currentUser.id).maybeSingle();
    if (error || !prof) {
      loadedUid = null;
      alert("Account profile not found. Please register again.");
      await sb.auth.signOut();
      return;
    }
    const { data: br } = await sb.from("branches").select("name").eq("code", prof.branch_code).maybeSingle();
    currentProfile = prof;
    currentProfile.branch_name = br ? br.name : prof.branch_code;
    isAdmin = prof.role === "admin";

    document.getElementById("userName").textContent = prof.name;
    document.getElementById("userEmail").textContent = prof.email;
    document.getElementById("userPhoto").style.display = "none";
    document.getElementById("roleLbl").textContent = isAdmin ? "Admin" : "Delivery";
    document.getElementById("pwBtn").classList.remove("hidden");
    document.getElementById("branchLbl").textContent = "Branch: " + currentProfile.branch_name + " (" + prof.branch_code + ")";
    document.getElementById("branchChip").classList.remove("hidden");
    document.getElementById("denomBranchNote").innerHTML = isAdmin
      ? "<strong>Branch: " + escapeHtml(currentProfile.branch_name) + "</strong> (code <strong>" + escapeHtml(prof.branch_code) + "</strong>). Denominations sent by delivery boys with this code appear on your Home page."
      : "You are sending to <strong>" + escapeHtml(currentProfile.branch_name) + "</strong> (code <strong>" + escapeHtml(prof.branch_code) + "</strong>). Only your branch admin will see it.";

    clearForm(true);
    document.getElementById("filterDate").value = "";
    resetDenomForm();
    document.getElementById("tabsBar").classList.toggle("hidden", !isAdmin);
    showTab(isAdmin ? "home" : "denom");
    startData();

    wasLoggedIn = true;
    playSplash("in", () => {
      document.getElementById("appScreen").classList.remove("hidden");
    });
  } else {
    loadedUid = null; currentUser = null; currentProfile = null; isAdmin = false;
    stopData();
    statements = []; pending = []; denomHistory = [];
    document.getElementById("branchChip").classList.add("hidden");
    document.getElementById("tabsBar").classList.add("hidden");
    renderPending();
    const showLogin = () => { location.replace("login"); };
    if (wasLoggedIn) { wasLoggedIn = false; playLogout(showLogin); }
    else showLogin();
  }
}
if (sb) sb.auth.onAuthStateChange((event, session) => { setTimeout(() => handleSession(session), 0); });

function escapeHtml(v){
  return String(v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");
}

/* ---------- TABS ---------- */
function showTab(t){
  if (t === "home" && !isAdmin) t = "denom";
  const home = t === "home";
  document.getElementById("homeView").classList.toggle("hidden", !home);
  document.getElementById("denomView").classList.toggle("hidden", home);
  document.getElementById("tabHome").classList.toggle("active", home);
  document.getElementById("tabDenom").classList.toggle("active", !home);
  window.scrollTo(0, 0);
}
document.getElementById("tabHome").onclick = () => showTab("home");
document.getElementById("tabDenom").onclick = () => showTab("denom");

/* ---------- IMAGE VIEWER ---------- */
const lightbox = document.getElementById("lightbox");
lightbox.onclick = () => { lightbox.style.display = "none"; };
function openImage(src){ document.getElementById("lightboxImg").src = src; lightbox.style.display = "flex"; }

/* ---------- DENOMINATION PAGE ---------- */
const NOTES = [500, 200, 100, 50, 20, 10, 5, 2, 1];

(function buildDenomGrid(){
  document.getElementById("denomGrid").innerHTML = NOTES.map(n =>
    '<div class="denom-row"><span class="dn">₹' + n + ' ×</span>' +
    '<input type="number" min="0" step="1" placeholder="0" data-note="' + n + '"/>' +
    '<span class="sub" id="sub' + n + '">₹0</span></div>'
  ).join("");
})();

function readNotes(){
  const notes = {};
  let cash = 0;
  document.querySelectorAll("#denomGrid input").forEach(inp => {
    const n = Number(inp.getAttribute("data-note"));
    const c = Math.max(0, Math.floor(Number(inp.value) || 0));
    notes[n] = c;
    cash += c * n;
  });
  return { notes, cash };
}

function updateDenomTotals(){
  const r = readNotes();
  NOTES.forEach(n => {
    document.getElementById("sub" + n).textContent = "₹" + (r.notes[n] * n).toLocaleString("en-IN");
  });
  const pp = Math.max(0, parseFloat(document.getElementById("dPhonepe").value) || 0);
  document.getElementById("dCash").textContent = money(r.cash);
  document.getElementById("dPP").textContent = money(pp);
  document.getElementById("dGrand").textContent = money(r.cash + pp);
}
document.getElementById("denomGrid").addEventListener("input", updateDenomTotals);
document.getElementById("dPhonepe").addEventListener("input", updateDenomTotals);

let photoData = "";
function compressImage(file){
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onerror = () => reject(new Error("Could not read the photo."));
    fr.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("This file is not a valid image."));
      img.onload = () => {
        let max = 900, q = 0.65, out = "";
        for (let i = 0; i < 5; i++) {
          const sc = Math.min(1, max / Math.max(img.width, img.height));
          const c = document.createElement("canvas");
          c.width = Math.round(img.width * sc);
          c.height = Math.round(img.height * sc);
          c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
          out = c.toDataURL("image/jpeg", q);
          if (out.length < 600000) break;
          max = Math.round(max * 0.8); q = Math.max(0.4, q - 0.08);
        }
        if (out.length >= 900000) reject(new Error("Photo is too large. Please use a smaller photo."));
        else resolve(out);
      };
      img.src = fr.result;
    };
    fr.readAsDataURL(file);
  });
}

document.getElementById("dPhoto").addEventListener("change", async e => {
  const f = e.target.files[0];
  const prev = document.getElementById("photoPreview");
  photoData = "";
  prev.style.display = "none";
  if (!f) return;
  try {
    photoData = await compressImage(f);
    prev.src = photoData;
    prev.style.display = "block";
  } catch (err) {
    alert(err.message);
    e.target.value = "";
  }
});

function resetDenomForm(){
  document.querySelectorAll("#denomGrid input").forEach(i => i.value = "");
  document.getElementById("dPhonepe").value = "";
  document.getElementById("dDelivery").value = "";
  document.getElementById("dPickup").value = "";
  document.getElementById("dPhoto").value = "";
  document.getElementById("photoPreview").style.display = "none";
  document.getElementById("dDate").value = today();
  document.getElementById("dRider").value = (currentProfile && currentProfile.name) || "";
  photoData = "";
  updateDenomTotals();
}
document.getElementById("dClear").onclick = () => { resetDenomForm(); document.getElementById("dMsg").style.display = "none"; };

document.getElementById("dSubmit").onclick = async () => {
  const rider = document.getElementById("dRider").value.trim();
  const date = document.getElementById("dDate").value;
  const r = readNotes();
  const pp = Math.max(0, parseFloat(document.getElementById("dPhonepe").value) || 0);
  const delivery = Math.max(0, Math.floor(Number(document.getElementById("dDelivery").value) || 0));
  const pickup = Math.max(0, Math.floor(Number(document.getElementById("dPickup").value) || 0));
  if (!rider || !date) { alert("Please enter rider name and date."); return; }
  if (r.cash <= 0 && pp <= 0) { alert("Please enter the denomination or PhonePe amount."); return; }
  if (!photoData) { alert("Please attach a photo."); return; }
  const btn = document.getElementById("dSubmit");
  btn.disabled = true; btn.textContent = "Sending...";
  try {
    const id = String(Date.now()) + Math.floor(Math.random() * 1000);
    const ins = await sb.from("denominations").insert({
      id, branch_code: currentProfile.branch_code, rider, date, notes: r.notes, cash: r.cash, phonepe: pp,
      delivery, pickup, photo: photoData, status: "pending", submitted_by: currentUser.id,
      submitter_name: currentProfile.name, created_at: Date.now()
    });
    if (ins.error) throw ins.error;
    refreshHistory();
    resetDenomForm();
    const m = document.getElementById("dMsg");
    m.textContent = "Sent for approval.";
    m.style.display = "block";
    setTimeout(() => { m.style.display = "none"; }, 6000);
  } catch (e) {
    alert("Could not send: " + e.message);
  } finally {
    btn.disabled = false; btn.textContent = "Send for Approval";
  }
};

/* ---------- PENDING APPROVALS (admin home) ---------- */
function updateBanner(n){
  const b = document.getElementById("denomBanner");
  if (n > 0 && isAdmin) {
    document.getElementById("denomBannerNum").textContent = n;
    document.getElementById("denomBannerText").textContent = n === 1 ? "1 denomination received" : n + " denominations received";
    b.classList.remove("collapsed");
  } else {
    b.classList.add("collapsed");
  }
}
function goPending(){
  showTab("home");
  const sec = document.getElementById("pendingSection");
  if (sec && !sec.classList.contains("hidden")) setTimeout(() => sec.scrollIntoView({behavior:"smooth", block:"start"}), 50);
}
document.getElementById("denomBannerIn").onclick = goPending;

function noteChips(p){
  return NOTES.filter(n => (p.notes && p.notes[n]) > 0)
    .map(n => '<span class="chip">₹' + n + ' × ' + p.notes[n] + ' = ₹' + (n * p.notes[n]).toLocaleString("en-IN") + '</span>').join("");
}

function renderPending(){
  updateBanner(pending.length);
  const sec = document.getElementById("pendingSection");
  if (!pending.length) { sec.classList.add("hidden"); document.getElementById("pendingList").innerHTML = ""; return; }
  sec.classList.remove("hidden");
  document.getElementById("pendingCount").textContent = pending.length;
  document.getElementById("pendingList").innerHTML = pending.map(p => {
    const chips = noteChips(p);
    const ppStage = p.status === "pp_pending";
    const totalsHtml = ppStage
      ? '<div class="pending-totals">' +
          '<div class="pt-left">' +
            '<span>Denomination (cash): <strong data-cash="1" class="green">' + money(p.cash) + ' &#10003; added</strong></span>' +
            '<span>PhonePe: <strong data-pp="1">' + money(p.phonepe) + '</strong></span>' +
          '</div>' +
          '<div class="cod-box"><span>Add to Paid to Company?</span><strong>' + money(p.phonepe) + '</strong></div>' +
        '</div>'
      : '<div class="pending-totals">' +
          '<div class="pt-left">' +
            '<span>Denomination (cash): <strong data-cash="1">' + money(p.cash) + '</strong></span>' +
            '<span>PhonePe: <strong data-pp="1">' + money(p.phonepe) + '</strong></span>' +
          '</div>' +
          '<div class="cod-box"><span>In Hand COD</span><strong>' + money(Number(p.cash || 0) + Number(p.phonepe || 0)) + '</strong></div>' +
        '</div>';
    const actionsHtml = ppStage
      ? '<div class="small" style="margin:0 0 10px">Cash accepted. Accept to add the PhonePe amount to <strong>Paid to Company</strong>, or Reject to skip it.</div>' +
        '<div class="pending-actions">' +
          '<button class="success" data-ppaccept="' + escapeHtml(p.docId) + '">Accept PhonePe</button>' +
          '<button class="danger" data-ppreject="' + escapeHtml(p.docId) + '">Reject</button>' +
        '</div>'
      : '<div class="pending-actions">' +
          '<button class="success" data-accept="' + escapeHtml(p.docId) + '">Accept</button>' +
          '<button class="danger" data-reject="' + escapeHtml(p.docId) + '">Reject</button>' +
        '</div>';
    return '<div class="pending-item">' +
      '<img class="pphoto" alt="Photo" src="' + p.photo + '" data-view="' + escapeHtml(p.docId) + '"/>' +
      '<div class="pending-info">' +
        '<h3>' + escapeHtml(p.rider) + ' &#8212; ' + formatDate(p.date) + '</h3>' +
        '<div class="meta">Sent by ' + escapeHtml(p.submitterName || "") + '</div>' +
        '<div class="pending-chips">' + (chips || '<span class="chip">No cash</span>') + '</div>' +
        '<div class="pending-chips"><span class="chip">Delivery given: ' + Number(p.delivery || 0) + '</span><span class="chip">Pickup to take: ' + Number(p.pickup || 0) + '</span></div>' +
        totalsHtml + actionsHtml +
      '</div></div>';
  }).join("");
}

document.getElementById("pendingList").addEventListener("click", e => {
  const v = e.target.getAttribute("data-view");
  const a = e.target.getAttribute("data-accept");
  const r = e.target.getAttribute("data-reject");
  if (v) { const p = pending.find(x => x.docId === v); if (p) openImage(p.photo); }
  const pa = e.target.getAttribute("data-ppaccept");
  const pr = e.target.getAttribute("data-ppreject");
  if (a) acceptDenom(a, e.target);
  if (r) rejectDenom(r, e.target);
  if (pa) acceptPhonepe(pa, e.target);
  if (pr) rejectPhonepe(pr, e.target);
});

let holdTotals = false;
const wait = ms => new Promise(r => setTimeout(r, ms));
const buzz = p => { try { navigator.vibrate && navigator.vibrate(p); } catch (e) {} };
const reduceMotion = () => window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
function totals(){
  const c = statements.reduce((s,i) => s + Number(i.collected||0), 0);
  const p = statements.reduce((s,i) => s + Number(i.paid||0), 0);
  return { c, p, b: c - p };
}

function showToast(msg, type){
  const t = document.createElement("div");
  t.className = "toast " + (type || "ok");
  t.innerHTML = '<span class="ti">' + (type === "reject" ? "&#10005;" : "&#10003;") + '</span><span></span>';
  t.lastChild.textContent = msg;
  document.body.appendChild(t);
  t.animate([{opacity:0, transform:"translateY(26px) scale(.92)"},{opacity:1, transform:"none"}], {duration:380, easing:"cubic-bezier(.2,.9,.3,1.2)", fill:"forwards"});
  setTimeout(() => {
    t.animate([{opacity:1},{opacity:0, transform:"translateY(14px)"}], {duration:300, fill:"forwards"}).onfinish = () => t.remove();
  }, 2800);
}

function burst(x, y, color){
  for (let i = 0; i < 16; i++) {
    const s = document.createElement("i");
    s.className = "spark";
    s.style.cssText = "left:" + x + "px;top:" + y + "px;background:" + (i % 2 ? color : "#f5a524");
    document.body.appendChild(s);
    const ang = Math.PI * 2 * i / 16 + Math.random() * 0.4, d = 36 + Math.random() * 48;
    s.animate([
      {transform:"translate(-50%,-50%) scale(1)", opacity:1},
      {transform:"translate(calc(-50% + " + Math.cos(ang) * d + "px),calc(-50% + " + Math.sin(ang) * d + "px)) scale(0)", opacity:0}
    ], {duration:650 + Math.random() * 250, easing:"cubic-bezier(.2,.8,.3,1)", fill:"forwards"}).onfinish = () => s.remove();
  }
}

function pulse(el){
  const s = el.closest(".stat");
  if (!s) return;
  s.classList.remove("pulse"); void s.offsetWidth; s.classList.add("pulse");
  setTimeout(() => s.classList.remove("pulse"), 1000);
  el.animate([{transform:"scale(1)"},{transform:"scale(1.18)"},{transform:"scale(1)"}], {duration:600, easing:"ease-out"});
}

function countTo(el, from, to, dur){
  const t0 = performance.now();
  (function step(t){
    const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
    el.textContent = money(from + (to - from) * e);
    if (k < 1) requestAnimationFrame(step); else el.textContent = money(to);
  })(t0);
}

function makeChip(rect, text, cls, target){
  const sx = rect.left + rect.width / 2, sy = rect.top + rect.height / 2;
  const wrap = document.createElement("div");
  wrap.className = "fly";
  wrap.style.cssText = "left:" + sx + "px;top:" + sy + "px";
  const chip = document.createElement("div");
  chip.className = "fly-in " + cls;
  chip.textContent = text;
  wrap.appendChild(chip);
  document.body.appendChild(wrap);
  return { wrap, chip, sx, sy, target, cls };
}

function launchChip(c, toEl, delay, onLand){
  const tr = toEl.getBoundingClientRect();
  const tx = tr.left + tr.width / 2, ty = tr.top + tr.height / 2;
  const dx = tx - c.sx, dy = ty - c.sy, dur = 1150;
  c.wrap.animate([{transform:"translateX(0)"},{transform:"translateX(" + dx + "px)"}], {duration:dur, delay, easing:"cubic-bezier(.45,.05,.25,1)", fill:"both"});
  const anim = c.chip.animate([
    {transform:"translateY(0) scale(1)", offset:0},
    {transform:"translateY(" + (Math.min(0, dy) - 90) + "px) scale(1.18)", offset:0.35},
    {transform:"translateY(" + dy + "px) scale(.45)", opacity:0.85, offset:1}
  ], {duration:dur, delay, easing:"ease-in-out", fill:"both"});
  return new Promise(res => {
    anim.onfinish = () => {
      c.wrap.remove();
      burst(tx, ty, c.cls === "pp" ? "#4d80f0" : "#1fa456");
      buzz(18);
      onLand();
      res();
    };
  });
}

function waitScrollEnd(){
  return new Promise(res => {
    let last = -1, same = 0;
    const iv = setInterval(() => {
      const y = window.scrollY;
      if (Math.abs(y - last) < 1) { if (++same >= 4) { clearInterval(iv); res(); } }
      else { same = 0; last = y; }
    }, 60);
    setTimeout(() => { clearInterval(iv); res(); }, 1800);
  });
}
async function scrollToSummary(){
  const sum = document.getElementById("totalBalance").closest(".card");
  const hdr = document.querySelector("header");
  const off = (hdr ? hdr.offsetHeight : 0) + 12;
  for (let i = 0; i < 3; i++) {
    const top = Math.max(0, sum.getBoundingClientRect().top + window.scrollY - off);
    if (Math.abs(window.scrollY - top) < 4) break;
    window.scrollTo({ top, behavior: "smooth" });
    await waitScrollEnd();
  }
}

async function playAcceptFX(chips, before, exp){
  const balEl = document.getElementById("totalBalance");
  const paidEl = document.getElementById("totalPaid");
  const colEl = document.getElementById("totalCollected");
  await wait(450);          /* let the accepted request leave the list and the layout settle */
  await scrollToSummary();  /* bring all 3 boxes into view */
  await wait(250);
  let colDone = false;
  const doCol = () => { if (!colDone) { colDone = true; countTo(colEl, before.c, exp.c, 900); pulse(colEl); } };
  const jobs = chips.map((c, i) => launchChip(c, c.target === "paid" ? paidEl : balEl, i * 230, () => {
    if (c.target === "paid") { countTo(paidEl, before.p, exp.p, 900); pulse(paidEl); }
    else { countTo(balEl, before.b, exp.b, 900); pulse(balEl); }
    doCol();
  }));
  if (!chips.length) {
    countTo(balEl, before.b, exp.b, 900); countTo(paidEl, before.p, exp.p, 900); doCol();
  }
  await Promise.all(jobs);
  await wait(1000);
  holdTotals = false;
  render();
}

async function acceptDenom(docId, btn){
  if (!sb || !isAdmin) return;
  const p = pending.find(x => x.docId === docId);
  btn.disabled = true;
  const item = btn.closest(".pending-item");
  const before = totals();
  const chips = [];
  if (p && item && !reduceMotion()) {
    const el = item.querySelector("[data-cash]");
    if (el && p.cash > 0) chips.push(makeChip(el.getBoundingClientRect(), "+" + money(p.cash), "cash", "bal"));
  }
  holdTotals = true;
  setTimeout(() => { if (holdTotals) { holdTotals = false; render(); } }, 8000);
  try {
    const { error } = await sb.rpc("accept_denomination", { p_id: docId });
    if (error) throw error;
    await Promise.all([refreshStatements(), refreshPending(), refreshHistory()]);
  } catch (e) {
    chips.forEach(c => c.wrap.remove());
    holdTotals = false; render();
    alert(e.message);
    btn.disabled = false;
    return;
  }
  buzz(30);
  showToast(p && Number(p.phonepe || 0) > 0 ? "Cash added — now confirm PhonePe" : "Accepted — totals updated", "ok");
  const cash = p ? Number(p.cash || 0) : 0;
  playAcceptFX(chips, before, { c: before.c + cash, p: before.p, b: before.b + cash });
}

async function acceptPhonepe(docId, btn){
  if (!sb || !isAdmin) return;
  btn.disabled = true;
  const p = pending.find(x => x.docId === docId);
  const item = btn.closest(".pending-item");
  const before = totals();
  const chips = [];
  const pp = p ? Number(p.phonepe || 0) : 0;
  if (p && item && !reduceMotion()) {
    const el = item.querySelector("[data-pp]");
    if (el && pp > 0) chips.push(makeChip(el.getBoundingClientRect(), "+" + money(pp), "pp", "paid"));
  }
  holdTotals = true;
  setTimeout(() => { if (holdTotals) { holdTotals = false; render(); } }, 8000);
  try {
    const { error } = await sb.rpc("accept_phonepe", { p_id: docId });
    if (error) throw error;
    await Promise.all([refreshStatements(), refreshPending(), refreshHistory()]);
  } catch (e) {
    chips.forEach(c => c.wrap.remove());
    holdTotals = false; render();
    alert(e.message);
    btn.disabled = false;
    return;
  }
  buzz(30);
  showToast("PhonePe added to Paid to Company", "ok");
  playAcceptFX(chips, before, { c: before.c, p: before.p + pp, b: before.b - pp });
}

async function rejectPhonepe(docId, btn){
  btn.disabled = true;
  const item = btn.closest(".pending-item");
  try {
    if (item) { item.classList.add("rejecting"); buzz([20, 50, 20]); await wait(680); }
    const { error } = await sb.rpc("reject_phonepe", { p_id: docId });
    if (error) throw error;
    await Promise.all([refreshPending(), refreshHistory()]);
    showToast("PhonePe not added", "reject");
  } catch (e) {
    if (item) item.classList.remove("rejecting");
    alert("Could not reject: " + e.message);
    btn.disabled = false;
  }
}

async function rejectDenom(docId, btn){
  if (!confirm("Reject this denomination request?")) return;
  btn.disabled = true;
  const item = btn.closest(".pending-item");
  try {
    if (item) { item.classList.add("rejecting"); buzz([20, 50, 20]); await wait(680); }
    const { error } = await sb.rpc("reject_denomination", { p_id: docId });
    if (error) throw error;
    await Promise.all([refreshPending(), refreshHistory()]);
    showToast("Request rejected", "reject");
  } catch (e) {
    if (item) item.classList.remove("rejecting");
    alert("Could not reject: " + e.message);
    btn.disabled = false;
  }
}

/* ---------- ORIGINAL STATEMENT LOGIC ---------- */
function updateDynamicDropdowns(){
  const names = [];
  statements.forEach(i => { if(i.person !== "Owner" && names.indexOf(i.person) === -1) names.push(i.person); });
  names.sort();
  document.getElementById("personList").innerHTML = '<option value="Owner"></option>' + names.map(n => '<option value="'+escapeHtml(n)+'"></option>').join("");
  const fs = document.getElementById("filterPerson");
  const cur = fs.value;
  fs.innerHTML = '<option value="ALL">All People</option><option value="Owner">Owner</option>' + names.map(n => '<option value="'+escapeHtml(n)+'">'+escapeHtml(n)+'</option>').join("");
  if(cur) fs.value = cur;
}

function getGlobalBalance(){
  return statements.reduce((s,i) => s + Number(i.collected||0), 0) - statements.reduce((s,i) => s + Number(i.paid||0), 0);
}

function addStatement(){
  const person = document.getElementById("person").value.trim();
  const date = document.getElementById("date").value;
  const paid = parseFloat(document.getElementById("paid").value) || 0;
  const isOwner = person.toLowerCase() === "owner";
  const name = isOwner ? "Owner" : person;

  if(!name || !date){ alert("Please enter a person name and date."); return; }
  if(paid < 0){ alert("Amount cannot be negative."); return; }

  let collected = 0;
  if(!isOwner){
    collected = parseFloat(document.getElementById("collected").value) || 0;
    if(collected < 0){ alert("Collection cannot be negative."); return; }
    if(paid > collected && !confirm("Paid to Company is greater than this person's collection. Continue?")) return;
  } else {
    if(paid <= 0){ alert("For Owner, enter the amount paid to the company."); return; }
    const gb = getGlobalBalance();
    if(gb <= 0){ alert("There is no outstanding balance to clear."); return; }
    if(paid > gb){ alert("Owner payment cannot be greater than the total outstanding balance.\n\nTotal balance: " + money(gb)); return; }
  }

  const id = String(Date.now()) + Math.floor(Math.random()*1000);
  sb.from("statements").insert({ id, branch_code: currentProfile.branch_code, person: name, date, collected, paid, balance: collected - paid,
      type: isOwner ? "owner" : "person", created_at: Date.now(), source: "web" })
    .then(({ error }) => { if (error) alert("Could not save: " + error.message); else refreshStatements(); });
  clearForm(false);
}

function clearForm(resetDate = true){
  document.getElementById("person").value = "";
  document.getElementById("collected").value = "";
  document.getElementById("paid").value = "";
  document.getElementById("collected").disabled = false;
  document.getElementById("collected").placeholder = "0";
  document.getElementById("ownerNote").style.display = "none";
  document.getElementById("ownerInfo").style.display = "none";
  if(resetDate) document.getElementById("date").value = today();
}

function updatePersonFields(){
  const isOwner = document.getElementById("person").value.trim().toLowerCase() === "owner";
  const c = document.getElementById("collected");
  c.disabled = isOwner;
  if(isOwner){
    c.value = ""; c.placeholder = "Not required for Owner";
    document.getElementById("ownerNote").style.display = "block";
    document.getElementById("ownerInfo").style.display = "block";
    document.getElementById("ownerCurrentBalance").textContent = money(getGlobalBalance());
  } else {
    c.placeholder = "0";
    document.getElementById("ownerNote").style.display = "none";
    document.getElementById("ownerInfo").style.display = "none";
  }
}

function removeStatement(id){
  if(confirm("Delete this statement?")){
    sb.from("statements").delete().eq("id", String(id)).then(({ error }) => { if (error) alert("Could not delete: " + error.message); else refreshStatements(); });
  }
}

function clearFilters(){
  document.getElementById("filterPerson").value = "ALL";
  document.getElementById("filterDate").value = "";
  render();
}

function render(){
  updateDynamicDropdowns();
  const fp = document.getElementById("filterPerson").value;
  const fd = document.getElementById("filterDate").value;
  const filtered = statements.filter(i => (fp === "ALL" || i.person === fp) && (!fd || i.date === fd));

  const allC = statements.reduce((s,i) => s + Number(i.collected||0), 0);
  const allP = statements.reduce((s,i) => s + Number(i.paid||0), 0);
  if (!holdTotals) {
    document.getElementById("totalCollected").textContent = money(allC);
    document.getElementById("totalPaid").textContent = money(allP);
    const be = document.getElementById("totalBalance");
    be.textContent = money(allC - allP);
    be.className = (allC - allP) >= 0 ? "green" : "red";
  }

  const container = document.getElementById("statementContainer");
  if(!filtered.length){ container.innerHTML = '<div class="empty">No statements found.</div>'; return; }

  const groups = {};
  filtered.forEach(i => { (groups[i.date] = groups[i.date] || []).push(i); });
  const dates = Object.keys(groups).sort((a,b) => b.localeCompare(a));

  container.innerHTML = dates.map(date => {
    const items = groups[date];
    const dc = items.reduce((s,i) => s + Number(i.collected||0), 0);
    const dp = items.reduce((s,i) => s + Number(i.paid||0), 0);
    const dbal = dc - dp;
    const ownerPay = items.filter(i => i.person === "Owner").reduce((s,i) => s + Number(i.paid||0), 0);
    const cls = dbal >= 0 ? "green" : "red";
    return `
    <div class="date-group">
      <div class="date-header">
        <div class="date-title">${formatDate(date)}</div>
        <div class="date-total">
          <span>Collected: <strong>${money(dc)}</strong></span>
          <span>Paid: <strong>${money(dp)}</strong></span>
          <span>Balance: <strong class="${cls}">${money(dbal)}</strong></span>
        </div>
      </div>
      <div class="table-wrap"><table>
        <thead><tr><th>Person</th><th>Collected</th><th>Paid to Company</th><th>Balance</th><th>Action</th></tr></thead>
        <tbody>${items.map(i => `
          <tr class="${i.person === "Owner" ? "owner-row" : ""}">
            <td><strong>${escapeHtml(i.person)}</strong></td>
            <td>${i.person === "Owner" ? "—" : money(i.collected)}</td>
            <td>${money(i.paid)}</td>
            <td>${i.person === "Owner"
              ? '<span class="badge blue">Owner Paid: '+money(i.paid)+'</span>'
              : '<span class="badge '+(i.balance >= 0 ? "green" : "red")+'">'+money(i.balance)+'</span>'}</td>
            <td><button class="danger" style="width:auto;height:34px;font-size:13px" data-del="${escapeHtml(i.id)}">Delete</button></td>
          </tr>`).join("")}
        </tbody>
      </table></div>
      ${ownerPay > 0 ? '<div class="global-payment">Owner payment recorded: <strong>'+money(ownerPay)+'</strong> — this payment reduces the overall balance across all dates.</div>' : ""}
      <div class="daily-summary">
        <span>Daily Collected: <strong>${money(dc)}</strong></span>
        <span>Daily Paid: <strong>${money(dp)}</strong></span>
        <span>Daily Balance: <strong class="${cls}">${money(dbal)}</strong></span>
      </div>
    </div>`;
  }).join("");
}

document.getElementById("person").addEventListener("input", updatePersonFields);
document.getElementById("addBtn").onclick = addStatement;
document.getElementById("clearBtn").onclick = () => clearForm(true);
document.getElementById("showAllBtn").onclick = clearFilters;
document.getElementById("filterPerson").onchange = render;
document.getElementById("filterDate").onchange = render;
document.getElementById("statementContainer").addEventListener("click", e => {
  const id = e.target.getAttribute("data-del");
  if(id) removeStatement(id);
});

/* ---------- DENOMINATION HISTORY (record only - never changes any totals) ---------- */
function renderHistory(){
  const box = document.getElementById("histContainer");
  if (!box) return;
  const fd = document.getElementById("hFilterDate").value;
  const list = denomHistory.filter(h => !fd || h.date === fd);
  if (!list.length) { box.innerHTML = '<div class="empty">No denomination history yet.</div>'; return; }
  const groups = {};
  list.forEach(h => { (groups[h.date] = groups[h.date] || []).push(h); });
  const dates = Object.keys(groups).sort((a,b) => String(b).localeCompare(String(a)));
  const num = v => (v === undefined || v === null) ? "—" : Number(v);
  box.innerHTML = dates.map(date => {
    const items = groups[date];
    return `
    <div class="date-group">
      <div class="date-header">
        <div class="date-title">${formatDate(date)}</div>
        <div class="date-total"><span>Entries: <strong>${items.length}</strong></span></div>
      </div>
      <div class="table-wrap"><table>
        <thead><tr><th>Rider</th><th>Denomination</th><th>Delivery</th><th>Pickup</th></tr></thead>
        <tbody>${items.map(h => `
          <tr>
            <td><strong>${escapeHtml(h.rider || "")}</strong><div class="small" style="margin:2px 0 0">By ${escapeHtml(h.submitterName || "")}</div><div style="margin-top:6px"><span class="badge ${h.status === "rejected" ? "red" : (h.status === "accepted" ? "green" : "blue")}">${h.status === "pp_pending" ? "Cash accepted" : (h.status === "accepted" ? "Accepted" : (h.status === "rejected" ? "Rejected" : "Pending"))}</span></div></td>
            <td><div class="pending-chips" style="margin-bottom:6px">${noteChips(h) || '<span class="chip">No cash</span>'}</div>
              <div class="small" style="margin:0">Cash: <strong>${money(h.cash)}</strong> &middot; PhonePe: <strong>${money(h.phonepe)}</strong></div></td>
            <td><strong>${num(h.delivery)}</strong></td>
            <td><strong>${num(h.pickup)}</strong></td>
          </tr>`).join("")}
        </tbody>
      </table></div>
    </div>`;
  }).join("");
}
document.getElementById("hFilterDate").onchange = renderHistory;
document.getElementById("hShowAll").onclick = () => { document.getElementById("hFilterDate").value = ""; renderHistory(); };
