/* View 3 - Historical debt: treemap of cumulative CO2 since 1750.
   Each rectangle's area = a country's total emissions. Scrolling spotlights groups. */

let treeRects;

// which countries (by iso3) to spotlight at each scroll step
const TREE_HIGHLIGHT = {
  0: null,                                   // everything
  1: ["USA"],
  2: ["USA","CHN","RUS","GBR","DEU","JPN","IND","FRA","CAN"], // early industrialisers
  3: ["CHN"]
};

function drawTreemap(){
  const data = DATA.tree;                    // [{name, iso3, cumulative, share}, ...]
  const box = size("v3-chart");
  const svg = d3.select("#v3-chart").append("svg")
      .attr("viewBox", `0 0 ${box.width} ${box.height}`);

  // .sum() picks the value that decides each rectangle's area
  const root = d3.hierarchy({ children: data })
      .sum(d => d.cumulative)
      .sort((a, b) => b.value - a.value);
  d3.treemap().size([box.width, box.height]).paddingInner(2)(root);

  // darker red = bigger share of all emissions ever
  const maxShare = d3.max(data, d => d.share || 0);
  const color = d3.scaleQuantize().domain([0, maxShare]).range(REDS);

  // one group per rectangle, moved to its computed corner (x0, y0)
  const cells = svg.selectAll("g").data(root.leaves()).join("g")
      .attr("transform", d => `translate(${d.x0},${d.y0})`);

  treeRects = cells.append("rect")
      .attr("width",  d => d.x1 - d.x0)
      .attr("height", d => d.y1 - d.y0)
      .attr("fill", d => d.data.iso3 === "ROW" ? "#ececf0" : color(d.data.share || 0))
      .attr("stroke", "#ffffff")
      .on("mousemove", (event, d) => showTooltip(
        `<div class="tt-title">${d.data.name}</div>
         <div><span class="tt-val">${formatInt(Math.round(d.data.cumulative / 1000))} bn t</span> total CO₂</div>
         ${d.data.share != null ? `<div>${d.data.share}% of all emissions ever</div>` : ""}`,
        event))
      .on("mouseleave", hideTooltip);

  // label bigger rectangles with the country code
  cells.filter(d => (d.x1 - d.x0) > 50 && (d.y1 - d.y0) > 26).append("text")
      .attr("x", 5).attr("y", 16).attr("font-size", 12).attr("font-weight", 600)
      .attr("fill", d => (d.data.share || 0) > maxShare * 0.5 ? "#fff" : "#1d1d1f")
      .text(d => d.data.iso3 === "ROW" ? "Rest of World" : d.data.iso3);

  // label smaller rectangles at a reduced font size
  cells.filter(d => {
    const w = d.x1 - d.x0, h = d.y1 - d.y0;
    return w > 24 && h > 11 && !(w > 50 && h > 26);
  }).append("text")
      .attr("x", 3)
      .attr("y", d => Math.min(10, (d.y1 - d.y0) - 2))
      .attr("font-size", 9).attr("font-weight", 600)
      .attr("fill", d => (d.data.share || 0) > maxShare * 0.5 ? "#fff" : "#1d1d1f")
      .text(d => d.data.iso3 === "ROW" ? "RoW" : d.data.iso3);

  treemapStep(0);
}

// fade everything except the spotlighted countries
function treemapStep(i){
  const keep = TREE_HIGHLIGHT[i];
  treeRects.classed("faded", d => keep && !keep.includes(d.data.iso3));
}
