/* Forgot password: sends branch code + email to the support inbox.
   Uses FormSubmit (free email relay, no backend needed).
   FIRST TIME ONLY: FormSubmit emails support.gkadda@gmail.com an activation link - click it once. */
const $ = id => document.getElementById(id);
const SUPPORT_EMAIL = "support.gkadda@gmail.com";
const errBox = $("loginError"), okBox = $("loginOk");
function showErr(m){ okBox.style.display = "none"; errBox.style.display = "block"; errBox.textContent = m; const c = $("axCard"); c.classList.remove("shake"); void c.offsetWidth; c.classList.add("shake"); }
function showOk(m){ errBox.style.display = "none"; okBox.style.display = "block"; okBox.textContent = m; }
$("axBack").onclick = () => { location.href = "login"; };
function step(which){
  $("stepChoose").classList.toggle("hidden", which !== "choose");
  $("stepDelivery").classList.toggle("hidden", which !== "delivery");
  $("stepAdmin").classList.toggle("hidden", which !== "admin");
  $("fSub").textContent = which === "choose" ? "First, tell us who you are" : which === "admin" ? "Enter your branch code and Gmail" : "Delivery boy password help";
  errBox.style.display = "none"; okBox.style.display = "none";
  $("loginScreen").dataset.role = which === "delivery" ? "delivery" : "admin";
}
$("chooseAdmin").onclick = () => step("admin");
$("chooseDelivery").onclick = () => step("delivery");
$("backFromDelivery").onclick = $("backFromAdmin").onclick = () => step("choose");
step("choose");

$("forgotForm").addEventListener("submit", async e => {
  e.preventDefault();
  errBox.style.display = "none"; okBox.style.display = "none";
  const code = $("fCode").value.trim().toUpperCase();
  const email = $("fEmail").value.trim();
  if (!/^[A-Z0-9]{4,12}$/.test(code)) { showErr("Enter your branch code (4-12 letters or numbers)."); return; }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { showErr("Enter a valid email address."); return; }
  const btn = $("fBtn");
  busy(btn, true, "Sending");
  try {
    let branchName = "";
    if (sb) { try { const r = await sb.rpc("branch_name_for_code", { p_code: code }); if (!r.error && r.data) branchName = r.data; } catch (_) {} }
    const res = await fetch("https://formsubmit.co/ajax/" + SUPPORT_EMAIL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({
        _subject: "Admin password reset request - Branch " + code,
        _template: "table",
        _captcha: "false",
        "Request": "Forgot password (ADMIN)",
        "Branch code": code,
        "Branch name": branchName || "(not found)",
        "User email": email,
        "Requested at": new Date().toLocaleString("en-IN"),
        _replyto: email
      })
    });
    const out = await res.json().catch(() => ({}));
    if (!res.ok || out.success === "false" || out.success === false) throw new Error(out.message || "Could not send the request.");
    $("forgotForm").reset();
    showOk("Request sent. We will reset your password and contact you on " + email + ".");
  } catch (err) {
    showErr("Could not send your request: " + err.message + " Please try again.");
  } finally {
    busy(btn, false, "Submit");
  }
});
