const $ = id => document.getElementById(id);
const esc = v => String(v == null ? "" : v).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
document.querySelector(".brand").onclick = () => { location.href = "dashboard"; };
$("backBtn").onclick = () => { location.href = "dashboard"; };
$("logoutBtn").onclick = async () => { try { Object.keys(sessionStorage).forEach(k => { if (k.indexOf("prof:") === 0) sessionStorage.removeItem(k); }); } catch (e) {} if (sb) await sb.auth.signOut(); location.replace("login"); };

async function loadTeam(){
  if (!sb) { $("tList").innerHTML = '<div class="empty">Supabase is not configured.</div>'; return; }
  const { data: s } = await sb.auth.getSession();
  if (!s.session) { location.replace("login"); return; }
  const { data: prof } = await sb.from("profiles").select("name,role,branch_code").eq("id", s.session.user.id).maybeSingle();
  if (!prof) { location.replace("login"); return; }
  $("tCode").textContent = prof.branch_code;
  const { data: br } = await sb.from("branches").select("name").eq("code", prof.branch_code).maybeSingle();
  $("tBranchName").textContent = br ? br.name : "Your branch";

  const { data, error } = await sb.rpc("branch_members");
  if (error) { $("tList").innerHTML = '<div class="empty">Could not load members. Run team-setup.sql and admin-setup.sql in Supabase first.</div>'; return; }
  const iAmAdmin = prof.role === "admin";
  const group = (title, cls, arr) => arr.length ? '<div class="rs-group">' + title + ' <span>(' + arr.length + ')</span></div>' +
    arr.map((m, n) => '<div class="rs-row ' + cls + '"><span class="rs-n">' + (n + 1) + '</span><strong>' + esc(m.name) + '</strong>' + (m.is_me ? '<em>you</em>' : '') +
      (iAmAdmin && cls === "dlv" && m.id ? '<button type="button" class="rs-pw" data-id="' + esc(m.id) + '" data-name="' + esc(m.name) + '">Change password</button>' : '') + '</div>').join("") : "";
  const admins = data.filter(m => m.role === "admin"), riders = data.filter(m => m.role !== "admin");
  $("tList").innerHTML = group("Admin", "adm", admins) + group("Delivery", "dlv", riders) || '<div class="empty">No members yet.</div>';
}
/* Change password: opens a small box right under the person's row (no popup) */
function closePwBoxes(){ document.querySelectorAll(".rs-pwbox").forEach(x => { const r = x.previousElementSibling; if (r) { const b = r.querySelector(".rs-pw"); if (b) b.textContent = "Change password"; } x.remove(); }); }
$("tList").addEventListener("click", async e => {
  const b = e.target.closest(".rs-pw");
  if (b) {
    const row = b.closest(".rs-row");
    const wasOpen = row.nextElementSibling && row.nextElementSibling.classList.contains("rs-pwbox");
    closePwBoxes();
    if (wasOpen) return;
    b.textContent = "Close";
    const box = document.createElement("form");
    box.className = "rs-pwbox"; box.autocomplete = "off";
    box.innerHTML = '<label>New password for <strong>' + esc(b.dataset.name) + '</strong></label>' +
      '<input type="password" class="pw1" placeholder="New password (min 6 characters)" autocomplete="new-password">' +
      '<input type="password" class="pw2" placeholder="Type it again to confirm" autocomplete="new-password">' +
      '<div class="rs-pwmsg" aria-live="polite"></div>' +
      '<div class="rs-pwact"><button type="submit" class="rs-save">Save password</button><button type="button" class="rs-cancel">Cancel</button></div>';
    row.after(box);
    box.querySelector(".pw1").focus();
    box.onsubmit = async ev => {
      ev.preventDefault();
      const p1 = box.querySelector(".pw1").value, p2 = box.querySelector(".pw2").value, msg = box.querySelector(".rs-pwmsg"), save = box.querySelector(".rs-save");
      msg.className = "rs-pwmsg";
      if (p1.length < 6) { msg.textContent = "Password must be at least 6 characters."; msg.classList.add("bad"); return; }
      if (p1 !== p2) { msg.textContent = "Passwords do not match. Nothing was changed."; msg.classList.add("bad"); return; }
      save.disabled = true; save.textContent = "Saving...";
      const { data, error } = await sb.rpc("admin_set_rider_password", { p_member: b.dataset.id, p_new: p1 });
      save.disabled = false; save.textContent = "Save password";
      if (error) { msg.textContent = "Could not change password: " + error.message; msg.classList.add("bad"); return; }
      msg.textContent = (data || "Password changed") + ". Tell " + b.dataset.name + " the new password.";
      msg.classList.add("ok");
      box.querySelector(".pw1").value = ""; box.querySelector(".pw2").value = "";
    };
    return;
  }
  if (e.target.closest(".rs-cancel")) closePwBoxes();
});
loadTeam();
