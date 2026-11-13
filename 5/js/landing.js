document.querySelectorAll("[data-open]").forEach(b => b.onclick = () => {
  const p = b.dataset.open.split(":");
  location.href = p[0] + (p[1] ? "?role=" + p[1] : "");
});
if (sb) sb.auth.getSession().then(({ data }) => { if (data.session) location.replace("dashboard"); });
document.getElementById("lpYear").textContent = new Date().getFullYear();
(function(){
  const els = document.querySelectorAll(".lp-rv");
  if (!("IntersectionObserver" in window)) { els.forEach(e => e.classList.add("in")); return; }
  const io = new IntersectionObserver(es => es.forEach(x => { if (x.isIntersecting) { x.target.classList.add("in"); io.unobserve(x.target); } }), { threshold: .12 });
  els.forEach((e, i) => { e.style.transitionDelay = (i % 3) * 90 + "ms"; io.observe(e); });
})();
