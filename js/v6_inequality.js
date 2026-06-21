/* View 6 - Inequality bar chart: every country sorted by CO2 per person (2022).
   Scrolling highlights the extremes, then recolours bars by share of warming. */

let ineqBars, ineqX, ineqY, ineqPlot, ineqData, ineqInnerW, ineqInnerH, warmColor;

function drawInequality(){
  // keep countries with a value, sort highest to lowest
  ineqData = DATA.inequality.filter(d => d.co2_pc != null)
                            .sort((a, b) => b.co2_pc - a.co2_pc);

  const box = size("v6-chart");
  const svg = d3.select("#v6-chart").append("svg")
      .attr("viewBox", `0 0 ${box.width} ${box.height}`);
  ineqPlot = svg.append("g").attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);
  ineqInnerW = box.width  - MARGIN.left - MARGIN.right;
  ineqInnerH = box.height - MARGIN.top  - MARGIN.bottom;

  // x = one slot per country (band scale), y = CO2 per person
  ineqX = d3.scaleBand().domain(ineqData.map((_, i) => i)).range([0, ineqInnerW]).padding(0.1);
  ineqY = d3.scaleLinear().domain([0, d3.max(ineqData, d => d.co2_pc)]).nice().range([ineqInnerH, 0]);

  // colour scale used in the final step (share of observed warming)
  warmColor = d3.scaleQuantize().domain([0, d3.max(ineqData, d => d.temp_share || 0)]).range(REDS);

  ineqPlot.append("g").attr("class", "axis").call(d3.axisLeft(ineqY).ticks(6));
  ineqPlot.append("text").attr("class", "annotation").attr("x", 0).attr("y", -12)
      .text("CO₂ per person, every country sorted (t/year, 2022)");

  ineqBars = ineqPlot.selectAll("rect").data(ineqData).join("rect")
      .attr("x", (_, i) => ineqX(i)).attr("width", ineqX.bandwidth())
      .attr("y", d => ineqY(d.co2_pc)).attr("height", d => ineqInnerH - ineqY(d.co2_pc))
      .attr("fill", "#fb6a4a")
      .on("mousemove", (event, d) => showTooltip(
        `<div class="tt-title">${d.name}</div>
         <div><span class="tt-val">${formatTonnes(d.co2_pc)} t</span> CO₂ / person</div>
         <div>pop ${formatPop(d.pop)}${d.temp_share != null ? ` · ${d.temp_share}% of global warming` : ""}</div>`,
        event))
      .on("mouseleave", hideTooltip);

  inequalityStep(0);

  // populate the country dropdown
  const v6select = document.getElementById("v6-country-select");
  ineqData.slice().sort((a, b) => d3.ascending(a.name, b.name)).forEach(c => {
    const opt = document.createElement("option");
    opt.value = c.iso3;
    opt.textContent = c.name;
    v6select.appendChild(opt);
  });
  v6select.addEventListener("change", function(e){
    highlightInequalityCountry(e.target.value || null);   // highlight only on this chart
  });
}

// highlight a single country selected via the dropdown
function highlightInequalityCountry(iso){
  ineqPlot.selectAll(".sel-label").remove();
  const hit = iso ? ineqData.find(d => d.iso3 === iso) : null;
  if (!hit){   // nothing selected, or country not on this chart -> reset
    ineqBars.attr("opacity", 0.9).attr("fill", "#fb6a4a");
    return;
  }
  ineqBars
    .attr("opacity", d => d.iso3 === iso ? 1 : 0.15)
    .attr("fill", d => d.iso3 === iso ? "#a50f15" : "#fb6a4a");
  {
    const i = ineqData.indexOf(hit);
    ineqPlot.append("text").attr("class", "annotation lead sel-label")
        .attr("x", Math.min(ineqX(i) + ineqX.bandwidth() / 2, ineqInnerW - 80))
        .attr("y", ineqY(hit.co2_pc) - 8)
        .attr("text-anchor", "middle")
        .text(`${hit.name}: ${formatTonnes(hit.co2_pc)} t`);
  }
}

// small helper: put a label above a country's bar
function ineqLabel(text, iso){
  const i = ineqData.findIndex(d => d.iso3 === iso);
  if (i < 0) return;
  ineqPlot.append("text").attr("class", "annotation lead step-label")
      .attr("x", Math.min(ineqX(i), ineqInnerW - 110))
      .attr("y", ineqY(ineqData[i].co2_pc) - 8).text(text);
}

function inequalityStep(i){
  ineqPlot.selectAll(".step-label").remove();

  if (i === 0){
    ineqBars.attr("opacity", 0.9).attr("fill", "#fb6a4a");

  } else if (i === 1){
    // spotlight the top (Qatar) and every country at or below Chad's level
    const chad = ineqData.find(d => d.iso3 === "TCD");
    const low = chad
      ? ineqData.filter(d => d.co2_pc <= chad.co2_pc).map(d => d.iso3)
      : [];
    ineqBars.attr("opacity", d => (d.iso3 === "QAT" || low.includes(d.iso3)) ? 1 : 0.18)
            .attr("fill", d => d.iso3 === "QAT" ? "#a50f15" : (low.includes(d.iso3) ? "#2ca25f" : "#fb6a4a"));
    ineqLabel("Qatar ≈ 35 t", "QAT");
    ineqLabel("Chad < 0.1 t", "TCD");

  } else if (i === 2){
    // highlight all the very-low emitters: least responsible, most exposed
    ineqBars.attr("opacity", d => d.co2_pc < 1 ? 0.95 : 0.18)
            .attr("fill", d => d.co2_pc < 1 ? "#2ca25f" : "#d9d9d9");
    ineqPlot.append("text").attr("class", "annotation lead step-label")
        .attr("x", ineqInnerW * 0.4).attr("y", ineqInnerH * 0.35)
        .text("Least responsible, often most exposed");

  } else {
    // recolour every bar by its share of observed warming
    ineqBars.attr("opacity", 0.95).transition().duration(600)
            .attr("fill", d => d.temp_share != null ? warmColor(d.temp_share) : "#d9d9d9");
  }
}
