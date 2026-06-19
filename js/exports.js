/* ============================================================================
   Cor Portal v2 - atlas export / download UI
   Serves the pre-baked, reading-level printouts (window.COR_EXPORTS, generated
   by scripts/gen-export.py + assemble-exports.py from the live snapshot). Two
   outputs from one markdown source per level:
     - Markdown:  a real .md file download (Blob).
     - PDF:       a print-styled window + the browser's print dialog ("Save as
                  PDF"). Zero dependencies, consistent with the no-build site.
   The content reflects exactly what the portal surfaces at the snapshot the
   export was compiled from (shown in the panel + stamped in every document).
   ============================================================================ */
(function () {
  "use strict";

  var EX = window.COR_EXPORTS;
  var panel = document.getElementById("dl-panel");
  if (!panel) return;
  if (!EX || !EX.docs || !EX.meta) {
    panel.innerHTML = "<p class='dl-unavailable'>Atlas export is unavailable - run " +
      "<code>build-snapshot</code>, <code>build-exports-corpus</code>, the export " +
      "workflow, then <code>assemble-exports</code>.</p>";
    return;
  }

  // ---- minimal, safe markdown -> HTML (only what our generator emits) -------
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function inline(s) {
    s = esc(s);
    s = s.replace(/`([^`]+)`/g, "<code>$1</code>");
    s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    s = s.replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");
    return s;
  }
  function mdToHtml(md) {
    var lines = String(md).replace(/\r\n/g, "\n").split("\n");
    var out = [], i = 0, para = [], list = null;
    function flushPara() { if (para.length) { out.push("<p>" + inline(para.join(" ")) + "</p>"); para = []; } }
    function flushList() { if (list) { out.push("<" + list.t + ">" + list.items.map(function (x) { return "<li>" + inline(x) + "</li>"; }).join("") + "</" + list.t + ">"); list = null; } }
    function flush() { flushPara(); flushList(); }
    for (; i < lines.length; i++) {
      var ln = lines[i];
      var t = ln.trim();
      if (!t) { flush(); continue; }
      var h = /^(#{1,6})\s+(.*)$/.exec(t);
      if (h) { flush(); var lv = h[1].length; out.push("<h" + lv + ">" + inline(h[2]) + "</h" + lv + ">"); continue; }
      if (/^(-{3,}|\*{3,}|_{3,})$/.test(t)) { flush(); out.push("<hr>"); continue; }
      if (/^>\s?/.test(t)) { flushPara(); flushList(); out.push("<blockquote>" + inline(t.replace(/^>\s?/, "")) + "</blockquote>"); continue; }
      var ul = /^[-*]\s+(.*)$/.exec(t);
      var ol = /^\d+\.\s+(.*)$/.exec(t);
      if (ul) { flushPara(); if (!list || list.t !== "ul") { flushList(); list = { t: "ul", items: [] }; } list.items.push(ul[1]); continue; }
      if (ol) { flushPara(); if (!list || list.t !== "ol") { flushList(); list = { t: "ol", items: [] }; } list.items.push(ol[1]); continue; }
      flushList(); para.push(t);
    }
    flush();
    return out.join("\n");
  }

  function today() {
    var d = new Date();
    function p(n) { return (n < 10 ? "0" : "") + n; }
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
  }
  function currentLevel() {
    var sel = panel.querySelector("input[name=dl-level]:checked");
    return sel ? sel.value : EX.meta.levels[0].key;
  }
  function docFor(key) { return EX.docs[key] || ""; }
  function fileBase(key) { return "cor-atlas-" + key + "-" + today(); }

  function downloadMarkdown(key) {
    var blob = new Blob([docFor(key)], { type: "text/markdown;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url; a.download = fileBase(key) + ".md";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }

  var PRINT_CSS =
    "@page{margin:18mm 16mm;}" +
    "*{box-sizing:border-box;}" +
    "body{font-family:'Spectral',Georgia,serif;color:#1a0608;line-height:1.6;max-width:820px;margin:0 auto;padding:24px;font-size:11.5pt;}" +
    "h1{font-size:26pt;color:#3a1218;margin:0 0 4px;line-height:1.12;}" +
    "h2{font-size:17pt;color:#3a1218;margin:30px 0 8px;padding-top:10px;border-top:2px solid rgba(58,18,24,.25);page-break-after:avoid;}" +
    "h3{font-size:12.5pt;color:#5a2a32;margin:18px 0 5px;letter-spacing:.01em;page-break-after:avoid;}" +
    "h4{font-size:11pt;color:#5a2a32;margin:14px 0 4px;}" +
    "p{margin:0 0 10px;}" +
    "ul,ol{margin:0 0 12px;padding-left:22px;}li{margin:0 0 4px;}" +
    "strong{color:#2a0c11;font-weight:600;}" +
    "code{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:.86em;background:rgba(58,18,24,.07);padding:1px 5px;border-radius:4px;}" +
    "hr{border:0;border-top:1px solid rgba(58,18,24,.22);margin:22px 0;}" +
    "blockquote{margin:0 0 14px;padding:8px 14px;border-left:3px solid #c4962c;background:rgba(196,150,44,.08);color:#4a1e26;font-size:.95em;}" +
    "h2{break-before:auto;}" +
    "@media print{a[href]:after{content:'';}}";

  function openPrint(key) {
    var meta = EX.meta;
    var html = "<!DOCTYPE html><html lang='en'><head><meta charset='utf-8'>" +
      "<title>" + esc(fileBase(key)) + "</title>" +
      "<link rel='preconnect' href='https://fonts.googleapis.com'>" +
      "<link href='https://fonts.googleapis.com/css2?family=Spectral:ital,wght@0,300;0,400;0,500;0,600;1,400&family=JetBrains+Mono:wght@400;500&display=swap' rel='stylesheet'>" +
      "<style>" + PRINT_CSS + "</style></head><body>" +
      mdToHtml(docFor(key)) +
      "<script>window.addEventListener('load',function(){setTimeout(function(){window.print();},350);});<\/script>" +
      "</body></html>";
    var w = window.open("", "_blank");
    if (!w) { alert("Pop-up blocked. Allow pop-ups for this page to print/save as PDF, or use Download Markdown."); return; }
    w.document.open(); w.document.write(html); w.document.close();
  }

  // ---- build the panel ------------------------------------------------------
  var m = EX.meta;
  var opts = m.levels.map(function (lv, i) {
    return "<label class='dl-opt'>" +
      "<input type='radio' name='dl-level' value='" + esc(lv.key) + "'" + (i === 0 ? " checked" : "") + ">" +
      "<span class='dl-opt-body'><span class='dl-opt-title'>" + esc(lv.title) + "</span>" +
      "<span class='dl-opt-sub'>" + esc(lv.subtitle) + "</span></span></label>";
  }).join("");

  panel.innerHTML =
    "<div class='dl-head'><span class='dia' aria-hidden='true'></span>" +
      "<div><h2 class='dl-title'>Download the full atlas</h2>" +
      "<p class='dl-sub'>A complete printout of every mechanism and its proxy gradient" +
      ((m.eea && m.eea.parameters) ? ", plus The Gap (" + esc(String(m.eea.parameters)) +
        " EEA baseline parameters across " + esc(String(m.eea.domains)) + " domains)" : "") +
      ", written for your audience. Compiled " + esc(m.compiled_at) + " from the snapshot built " +
      esc(m.source_built_at) + " - " + esc(String(m.counts.mechanisms)) + " mechanisms, " +
      esc(String(m.gradients_derived)) + " with a derived gradient.</p></div></div>" +
    "<fieldset class='dl-levels'><legend class='dl-legend'>Reading level</legend>" + opts + "</fieldset>" +
    "<div class='dl-actions'>" +
      "<button type='button' class='dl-btn dl-md' id='dl-md'>Download Markdown<small>.md file</small></button>" +
      "<button type='button' class='dl-btn dl-pdf' id='dl-pdf'>Download PDF<small>opens print dialog</small></button>" +
    "</div>";

  panel.querySelector("#dl-md").addEventListener("click", function () { downloadMarkdown(currentLevel()); });
  panel.querySelector("#dl-pdf").addEventListener("click", function () { openPrint(currentLevel()); });
})();
