const $ = id => document.getElementById(id);
const IS_REG = document.body.dataset.page === "register";
const params = new URLSearchParams(location.search);
let regRole = params.get("role") === "admin" ? "admin" : "delivery";
const loginError = document.getElementById("loginError");
const loginOk = document.getElementById("loginOk");
function showLoginError(msg){ loginOk.style.display = "none"; loginError.style.display = "block"; loginError.textContent = msg; const c = document.getElementById("axCard"); c.classList.remove("shake"); void c.offsetWidth; c.classList.add("shake"); }
function showLoginOk(msg){ loginError.style.display = "none"; loginOk.style.display = "block"; loginOk.textContent = msg; }
function clearAuthMsgs(){ loginError.style.display = "none"; loginOk.style.display = "none"; }
function paintAuth(){
  const adm = regRole === "admin";
  $("loginScreen").dataset.role = regRole;
  $("axTitle").textContent = (adm ? "Admin" : "Delivery") + (IS_REG ? " account" : " sign in");
  $("authSub").textContent = IS_REG ? "Create your account in a minute" : "Sign in with your email and password";
  if (!IS_REG) {
    $("lPassLbl").textContent = "Password";
    $("loginHint").textContent = adm ? "Use the password you created for your admin account." : "Use the password you created. Older accounts can still use their branch code.";
  }
}
function setRegRole(r){
  regRole = r;
  const adm = r === "admin";
  if (IS_REG) {
    $("rBranchNameWrap").classList.toggle("hidden", !adm);
    $("rCodeLbl").textContent = adm ? "Create branch code" : "Branch code";
    $("rCodeHint").textContent = adm
      ? "Choose a unique code (4-12 letters/numbers). Share it with your delivery boys so they can join. Everyone signs in with their own password."
      : "Ask your admin for the branch code, then create your own password.";
  } else { const lp = $("lPass"); lp.value = ""; lp.type = "password"; }
  paintAuth();
  clearAuthMsgs();
}
if (!IS_REG) $("eyeBtn").onclick = () => { const p = $("lPass"); p.type = p.type === "password" ? "text" : "password"; };
$("axBack").onclick = () => { location.href = "index.html"; };
$("roleDelivery").onclick = () => setRegRole("delivery");
$("roleAdmin").onclick = () => setRegRole("admin");
if (IS_REG) $("atLogin").onclick = () => { location.href = "login.html?role=" + regRole; };
else $("atReg").onclick = () => { location.href = "register.html?role=" + regRole; };
addEventListener("pointermove", e => { const s = $("loginScreen"); s.style.setProperty("--px", (e.clientX / innerWidth - .5) * 2); s.style.setProperty("--py", (e.clientY / innerHeight - .5) * 2); });

async function finishLogin(){
  const { data: s } = await sb.auth.getSession();
  const uid = s.session && s.session.user.id;
  const { data: prof } = uid ? await sb.from("profiles").select("role").eq("id", uid).maybeSingle() : {};
  if (!prof) { showLoginError("Account profile not found. Please register again."); await sb.auth.signOut(); return; }
  if (prof.role !== regRole) { showLoginError("This is " + (prof.role === "admin" ? "an Admin" : "a Delivery boy") + " account. Switch the selector above and try again."); await sb.auth.signOut(); return; }
  location.href = "dashboard.html";
}
if (!IS_REG) document.getElementById("loginForm").addEventListener("submit", async e => {
  e.preventDefault();
  clearAuthMsgs();
  if (configMissing) { showLoginError("Supabase is not configured yet. Paste your URL and anon key in the script."); return; }
  const email = document.getElementById("lEmail").value.trim();
  const adm = regRole === "admin";
  const raw = document.getElementById("lPass").value;
  if (!email || !raw.trim()) { showLoginError("Enter your email and password."); return; }
  const btn = document.getElementById("loginBtn");
  busy(btn, true, "Signing in");
  let { error } = await sb.auth.signInWithPassword({ email, password: raw });
  if (error && !adm && /invalid login/i.test(error.message)) {   /* older delivery accounts: branch code */
    ({ error } = await sb.auth.signInWithPassword({ email, password: pwFromCode(raw) }));
  }
  busy(btn, false, "Continue");
  if (error) { showLoginError(/invalid login/i.test(error.message) ? "Wrong email or password." : error.message); return; }
  await finishLogin();
});

if (IS_REG) document.getElementById("regForm").addEventListener("submit", async e => {
  e.preventDefault();
  clearAuthMsgs();
  if (configMissing) { showLoginError("Supabase is not configured yet. Paste your URL and anon key in the script."); return; }
  const name = document.getElementById("rName").value.trim();
  const email = document.getElementById("rEmail").value.trim();
  const code = document.getElementById("rCode").value.trim().toUpperCase();
  const branchName = document.getElementById("rBranchName").value.trim();
  const adm = regRole === "admin";
  const password = document.getElementById("rPass").value;
  if (password.length < 6) { showLoginError("Password must be at least 6 characters."); return; }
  if (!name) { showLoginError("Enter your name."); return; }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { showLoginError("Enter a valid Gmail address."); return; }
  if (!/^[A-Z0-9]{4,12}$/.test(code)) { showLoginError("Branch code must be 4-12 letters or numbers (no spaces)."); return; }
  if (adm && !branchName) { showLoginError("Enter your branch name."); return; }
  const btn = document.getElementById("regBtn");
  busy(btn, true, "Creating account...");
  try {
    const chk = await sb.rpc("branch_name_for_code", { p_code: code });
    if (chk.error) throw chk.error;
    if (adm && chk.data) { showLoginError("This branch code is already taken. Choose another."); return; }
    if (!adm && !chk.data) { showLoginError("Invalid branch code. Ask your admin for the correct code."); return; }
    const { data, error } = await sb.auth.signUp({
      email, password,
      options: { data: { name, role: regRole, branch_code: code, branch_name: branchName } }
    });
    if (error) {
      showLoginError(/database error/i.test(error.message) ? "Registration failed. Check the branch code and try again." : error.message);
      return;
    }
    if (data.session) location.href = "dashboard.html";
    else location.href = "login.html?role=" + regRole + "&registered=1&email=" + encodeURIComponent(email);
  } catch (err) {
    showLoginError("Registration failed: " + err.message);
  } finally {
    busy(btn, false, "Create account");
  }
});

if (!IS_REG) {
  if (params.get("email")) $("lEmail").value = params.get("email");
  if (params.get("registered")) showLoginOk("Account created. Check your email to confirm it, then log in.");
}
if (sb) sb.auth.getSession().then(({ data }) => { if (data.session) location.replace("dashboard.html"); });
setRegRole(regRole);
