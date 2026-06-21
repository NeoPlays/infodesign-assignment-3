/* View 5 - Wealth vs. emissions (bubble scatter, 2022).
   x = GDP per person (log), y = CO2 per person, size = population, colour = continent.
   Interactions: hover tooltip + a country dropdown highlight. */

let scatX, scatY, scatR, scatDots, scatPlot, scatData;

// contrasted in the story: same wealth, very different CO2
const SCATTER_PAIR = ["NOR", "QAT"];

function drawScatter(){
  scatData = DATA.scatter.data;              // [{name, iso3, gdp_pc, co2_pc, pop, continent}]
  const box = size("v5-chart");
  const svg = d3.select("#v5-chart").append("svg")
      .attr("viewBox", `0 0 ${box.width} ${box.height}`);
  scatPlot = svg.append("g").attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);
  const innerW = box.width  - MARGIN.left - MARGIN.right;
  const innerH = box.height - MARGIN.top  - MARGIN.bottom;

  // SCALES
  scatX = d3.scaleLog().domain([400, d3.max(scatData, d => d.gdp_pc) * 1.1]).range([0, innerW]);
  scatY = d3.scaleLinear().domain([0, d3.max(scatData, d => d.co2_pc) * 1.05]).nice().range([innerH, 0]);
  scatR = d3.scaleSqrt().domain([0, d3.max(scatData, d => d.pop)]).range([2, 32]); // area ~ population

  // AXES
  scatPlot.append("g").attr("class", "axis").attr("transform", `translate(0,${innerH})`)
      .call(d3.axisBottom(scatX).ticks(5, "$~s"));
  scatPlot.append("g").attr("class", "axis")
      .call(d3.axisLeft(scatY).ticks(6));
  scatPlot.append("text").attr("class", "annotation").attr("x", 0).attr("y", -12)
      .text("↑ CO₂ per person (t)     → GDP per person (log scale)");

  // one circle per country
  scatDots = scatPlot.selectAll("circle").data(scatData).join("circle")
      .attr("cx", d => scatX(d.gdp_pc))
      .attr("cy", d => scatY(d.co2_pc))
      .attr("r",  d => scatR(d.pop))
      .attr("fill", d => CONTINENT_COLORS[d.continent])
      .attr("opacity", 0.75)
      .attr("stroke", "#fff").attr("stroke-width", 0.5)
      .on("mousemove", (event, d) => showTooltip(
        `<div class="tt-title">${d.name}</div>
         <div><span class="tt-val">${formatTonnes(d.co2_pc)} t</span> CO₂ / person</div>
         <div>GDP ${d3.format("$,d")(d.gdp_pc)} · pop ${formatPop(d.pop)}</div>`, event))
      .on("mouseleave", hideTooltip);

  scatterStep(0);

  // populate the country dropdown
  const v5select = document.getElementById("v5-country-select");
  scatData.slice().sort((a, b) => d3.ascending(a.name, b.name)).forEach(c => {
    const opt = document.createElement("option");
    opt.value = c.iso3;
    opt.textContent = c.name;
    v5select.appendChild(opt);
  });
  v5select.addEventListener("change", function(e){
    highlightScatter(e.target.value || null);
  });
}

// highlight one country (called by the dropdown)
function highlightScatter(iso){
  const hit = scatData.find(d => d.iso3 === iso);
  if (!hit) iso = null;   // not on this chart -> show everything normally

  scatDots.attr("opacity", d => (!iso || d.iso3 === iso) ? 0.9 : 0.2)
          .attr("stroke", d => d.iso3 === iso ? "#1d1d1f" : "#fff")
          .attr("stroke-width", d => d.iso3 === iso ? 2 : 0.5);

  scatPlot.selectAll(".sel-label").remove();
  if (hit){
    scatPlot.append("text").attr("class", "annotation lead sel-label")
        .attr("x", scatX(hit.gdp_pc) + 8).attr("y", scatY(hit.co2_pc) - 8).text(hit.name);
  }
}

// scroll steps
function scatterStep(i){
  scatPlot.selectAll(".sel-label").remove();
  if (i === 1){
    // spotlight Norway vs. Qatar
    scatDots.attr("opacity", d => SCATTER_PAIR.includes(d.iso3) ? 1 : 0.12);
    scatData.filter(d => SCATTER_PAIR.includes(d.iso3)).forEach(d => {
      scatPlot.append("text").attr("class", "annotation lead sel-label")
          .attr("x", scatX(d.gdp_pc) + 8).attr("y", scatY(d.co2_pc) - 8).text(d.name);
    });
  } else {
    // reset
    scatDots.attr("opacity", 0.75).attr("stroke", "#fff").attr("stroke-width", 0.5);
  }
}
