/* Preview only (preview/front-door). Fills the counts in the new hero from the
   baked snapshot, so no number on the page is typed by hand. If a value is
   missing the typed fallback in the HTML stays. */
(function (global) {
  "use strict";
  var D = global.CorData;
  if (!D) return;
  function set(id, v) {
    var el = document.getElementById(id);
    if (el && typeof v === "number" && v > 0) el.textContent = String(v);
  }
  function run() {
    var c = D.counts() || {};
    set("pv-mech-count", c.mechanisms);
    set("pv-eea-count", c.eea_parameters || (D.eeaParameters ? D.eeaParameters().length : 0));
    var ch = D.challenges ? D.challenges() : null;
    set("pv-ch-count", ch && ch.rows ? ch.rows.length : 0);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run);
  else run();
})(window);
