/* PREVIEW ONLY. The preview pages use <base href="/"> so the live css, js and data load.
   That base would also send in-page links ("#how-built") and history.replaceState("#M3")
   to the live home page. This keeps both on the preview page. Load it before other scripts. */
(function () {
  "use strict";
  function here(u) {
    return (typeof u === "string" && u.charAt(0) === "#") ? location.pathname + location.search + u : u;
  }
  var rs = history.replaceState, ps = history.pushState;
  history.replaceState = function (s, t, u) { return rs.call(history, s, t, here(u)); };
  history.pushState = function (s, t, u) { return ps.call(history, s, t, here(u)); };
  document.addEventListener("click", function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href^="#"]') : null;
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    var h = a.getAttribute("href");
    if (location.hash === h) { var el = document.getElementById(h.slice(1)); if (el) el.scrollIntoView(); }
    else location.hash = h;
  });
})();
