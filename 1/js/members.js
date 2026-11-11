const $ = id => document.getElementById(id);
const esc = v => String(v == null ? "" : v).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
RippleBG.attach($("rsPage"), { tone: "light", interval: 2400 });
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
  if (error) { $("tList").innerHTML = '<div class="empty">Could not load members. Run team-setup.sql in Supabase first.</div>'; return; }
  const group = (title, cls, arr) => arr.length ? '<div class="rs-group">' + title + ' <span>(' + arr.length + ')</span></div>' +
    arr.map((m, n) => '<div class="rs-row ' + cls + '"><span class="rs-n">' + (n + 1) + '</span><strong>' + esc(m.name) + '</strong>' + (m.is_me ? '<em>you</em>' : '') + '</div>').join("") : "";
  const admins = data.filter(m => m.role === "admin"), riders = data.filter(m => m.role !== "admin");
  $("tList").innerHTML = group("Admin", "adm", admins) + group("Delivery", "dlv", riders) || '<div class="empty">No members yet.</div>';
}
loadTeam();
