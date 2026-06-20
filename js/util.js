/* util.js - global helpers shared by every chart. Loaded first. */

// app.js fills this at startup; every chart reads from it (DATA.trend, ...).
const DATA = {};

// ---- colours ----
const REDS = ["#fee5d9", "#fcae91", "#fb6a4a", "#de2d26", "#a50f15"];  // low -> high
const CONTINENT_COLORS = {
  "Africa": "#66c2a5", "Asia": "#fc8d62", "Europe": "#8da0cb",
  "North America": "#e78ac3", "South America": "#a6d854", "Oceania": "#ffd92f"
};
const FUEL_COLORS = {
  coal: "#4d4d4d", oil: "#d62728", gas: "#2ca25f", cement: "#bdbdbd", flaring: "#d9a441"
};

const MARGIN = { top: 30, right: 24, bottom: 40, left: 56 };

// ---- number formatting ----
const formatTonnes = d3.format(",.1f");
const formatInt    = d3.format(",d");

// turn a population number into "1.4 bn" / "82.3 M"
function formatPop(n){
  if (n >= 1e9) return (n / 1e9).toFixed(2) + " bn";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + " M";
  return formatInt(n);
}

// ---- measure a chart's container so the SVG fits exactly ----
function size(containerId){
  const box = document.getElementById(containerId).getBoundingClientRect();
  return { width: Math.max(320, box.width), height: Math.max(320, box.height) };
}

// ---- tooltip (floating box shown on hover) ----
function showTooltip(html, event){
  const tip = document.getElementById("tooltip");
  tip.innerHTML = html;
  tip.style.opacity = 1;
  moveTooltip(event);
}
function moveTooltip(event){
  const tip = document.getElementById("tooltip");
  // place next to the cursor
  tip.style.left = (event.clientX + 14) + "px";
  tip.style.top  = (event.clientY + 14) + "px";
}
function hideTooltip(){
  document.getElementById("tooltip").style.opacity = 0;
}
