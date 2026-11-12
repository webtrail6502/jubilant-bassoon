const $ = id => document.getElementById(id);
const esc = v => String(v == null ? "" : v).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
$("backBtn").onclick = () => { location.href = "dashboard"; };
$("logoutBtn").onclick = async () => { if (sb) await sb.auth.signOut(); location.replace("login"); };

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
$("tList").addEventListener("click", async e => {
  const b = e.target.closest(".rs-pw"); if (!b) return;
  const name = b.dataset.name;
  const p1 = prompt("New password for " + name + " (minimum 6 characters):");
  if (p1 === null) return;
  if (p1.length < 6) { alert("Password must be at least 6 characters."); return; }
  const p2 = prompt("Type the new password again to confirm:");
  if (p1 !== p2) { alert("Passwords do not match. Nothing was changed."); return; }
  b.disabled = true;
  const { data, error } = await sb.rpc("admin_set_rider_password", { p_member: b.dataset.id, p_new: p1 });
  b.disabled = false;
  alert(error ? "Could not change password: " + error.message : data + ".\n\nTell " + name + " the new password.");
});
loadTeam();
