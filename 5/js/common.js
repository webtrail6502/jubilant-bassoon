/* ================= SUPABASE CONFIG =================
   1. Create a free project at https://supabase.com
   2. Run supabase-setup.sql in the SQL editor
   3. Paste Project URL + anon public key below (Project Settings -> API) */
const SUPABASE_URL = "https://zqaequyzdrngxnifdkty.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_oqXbagCuLh4DUAy4F-Cfmw_kigOJE8T";

const configMissing = SUPABASE_URL.indexOf("YOUR_") === 0 || SUPABASE_ANON_KEY.indexOf("YOUR_") === 0;
let sb = null, currentUser = null, currentProfile = null, isAdmin = false, rtChannel = null;
if (!configMissing) sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const pwFromCode = c => "BC-" + String(c || "").trim().toUpperCase();   /* branch code is the password */
function busy(btn, on, text){ btn.disabled = on; if (text) btn.textContent = text; }
const LOGO_URL = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHZpZXdCb3g9JzAgMCAyNTYgMjU2Jz48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9J2cnIHgxPScwJyB5MT0nMCcgeDI9JzEnIHkyPScxJz48c3RvcCBvZmZzZXQ9JzAnIHN0b3AtY29sb3I9JyMxYTRhNmUnLz48c3RvcCBvZmZzZXQ9JzEnIHN0b3AtY29sb3I9JyMwNjEzMWYnLz48L2xpbmVhckdyYWRpZW50PjxsaW5lYXJHcmFkaWVudCBpZD0naycgeDE9JzAnIHkxPScwJyB4Mj0nMScgeTI9JzEnPjxzdG9wIG9mZnNldD0nMCcgc3RvcC1jb2xvcj0nI2VjZDI4ZicvPjxzdG9wIG9mZnNldD0nMScgc3RvcC1jb2xvcj0nI2I4OTAyZicvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjxyZWN0IHdpZHRoPScyNTYnIGhlaWdodD0nMjU2JyByeD0nNTYnIGZpbGw9J3VybCgjZyknLz48cGF0aCBkPSdNMTI4IDUwIEwxOTggODggVjE2OCBMMTI4IDIwNiBMNTggMTY4IFY4OCBaJyBmaWxsPScjZmZmZmZmJyBmaWxsLW9wYWNpdHk9Jy4xMCcgc3Ryb2tlPScjZWNkMjhmJyBzdHJva2Utd2lkdGg9JzknIHN0cm9rZS1saW5lam9pbj0ncm91bmQnLz48cGF0aCBkPSdNNTggODggTDEyOCAxMjYgTDE5OCA4OCBNMTI4IDEyNiBWMjA2JyBmaWxsPSdub25lJyBzdHJva2U9JyNlY2QyOGYnIHN0cm9rZS13aWR0aD0nOScgc3Ryb2tlLWxpbmVqb2luPSdyb3VuZCcgc3Ryb2tlLWxpbmVjYXA9J3JvdW5kJy8+PGNpcmNsZSBjeD0nMTkwJyBjeT0nMTkwJyByPSczNicgZmlsbD0ndXJsKCNrKScvPjx0ZXh0IHg9JzE5MCcgeT0nMjA2JyBmb250LXNpemU9JzQ2JyBmb250LXdlaWdodD0nODAwJyB0ZXh0LWFuY2hvcj0nbWlkZGxlJyBmaWxsPScjMDYxMzFmJyBmb250LWZhbWlseT0nQXJpYWwsSGVsdmV0aWNhLHNhbnMtc2VyaWYnPiYjODM3Nzs8L3RleHQ+PC9zdmc+";
if (LOGO_URL) ["loginLogo","headerLogo","landLogo"].forEach(id => { const el = document.getElementById(id); if (el) { el.src = LOGO_URL; el.style.display = "block"; } });
const money = n => "₹" + Number(n || 0).toLocaleString("en-IN", {minimumFractionDigits:2, maximumFractionDigits:2});
const today = () => { const d = new Date(); return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); };
const formatDate = d => { if(!d) return ""; const p = d.split("-"); return p[2]+"-"+p[1]+"-"+p[0]; };
/* ---- Last-seen / presence heartbeat (shown to the owner) ----
   - beats every 10s while the page is visible
   - marks the user OFFLINE immediately on logout / tab close
   - if the browser dies, the owner page treats them offline after 30s */
(function(){
  if (typeof sb === "undefined" || !sb) return;
  let last = 0, token = null;
  sb.auth.getSession().then(({ data }) => { token = data && data.session ? data.session.access_token : null; });
  sb.auth.onAuthStateChange((ev, s) => { token = s ? s.access_token : null; });

  function ping(online){
    if (!token) return Promise.resolve();
    return fetch(SUPABASE_URL + "/rest/v1/rpc/touch_last_seen", {
      method: "POST", keepalive: true,
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: "Bearer " + token, "Content-Type": "application/json" },
      body: JSON.stringify({ p_online: online })
    }).catch(() => {});
  }
  function beat(){
    if (document.hidden || !token || Date.now() - last < 8000) return;
    last = Date.now(); ping(true);
  }

  /* logout: write "offline + exact logout time" BEFORE the session is destroyed */
  const origSignOut = sb.auth.signOut.bind(sb.auth);
  sb.auth.signOut = async function(...a){
    try { await Promise.race([ping(false), new Promise(r => setTimeout(r, 2500))]); } catch (e) {}
    token = null;
    return origSignOut(...a);
  };

  setInterval(beat, 10000);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) beat(); });
  window.addEventListener("focus", beat);
  window.addEventListener("pagehide", () => { ping(false); });   /* tab / browser closed */
  setTimeout(beat, 1500);
})();
