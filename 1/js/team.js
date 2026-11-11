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
  if (error) { $("tList").innerHTML = '<div class="empty">Could not load members. Run team-setup.sql in Supabase first.</div>'; return; }
  $("tCount").textContent = "(" + data.length + ")";
  $("tList").innerHTML = '<div class="table-wrap"><table><thead><tr><th>#</th><th>Name</th><th>Role</th></tr></thead><tbody>' +
    data.map((m, i) => '<tr><td>' + (i + 1) + '</td><td><strong>' + esc(m.name) + '</strong>' + (m.is_me ? ' <span class="small">(you)</span>' : '') +
      '</td><td><span class="badge ' + (m.role === "admin" ? "blue" : "green") + '">' + (m.role === "admin" ? "Admin" : "Delivery") + '</span></td></tr>').join("") +
    '</tbody></table></div>';
}
loadTeam();
