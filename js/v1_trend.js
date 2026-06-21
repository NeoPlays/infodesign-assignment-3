/* View 1 - Global CO2 over time (animated line chart).
   Each scroll step draws the line a little further and labels a milestone. */

let trendX, trendY, trendLinePath, trendAreaPath, trendLine, trendArea, trendNotes, trendData, trendW, trendH;

// how far (which year) the line is drawn at each scroll step
const TREND_CUTOFFS = [1800, 1850, 1950, 2000, 2023];

// labels shown at certain cut-off years
const TREND_LABELS = {
  1850: "Industrial Revolution",
  1950: "Post-war boom",
  2000: "China's rise",
  2023: "~38 bn tonnes / year"
};

function drawTrend(){
  trendData = DATA.trend;                       // [{year, co2}, ...]

  const box = size("v1-chart");
  trendW = box.width; trendH = box.height;

  const svg = d3.select("#v1-chart").append("svg")
      .attr("viewBox", `0 0 ${trendW} ${trendH}`);

  const plot = svg.append("g")
      .attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);
  const innerW = trendW - MARGIN.left - MARGIN.right;
  const innerH = trendH - MARGIN.top - MARGIN.bottom;

  trendX = d3.scaleLinear().domain([1750, 2023]).range([0, innerW]);
  trendY = d3.scaleLinear().domain([0, d3.max(trendData, d => d.co2)]).nice().range([innerH, 0]);

  plot.append("g").attr("class", "axis")
      .attr("transform", `translate(0,${innerH})`)
      .call(d3.axisBottom(trendX).tickFormat(d3.format("d")).ticks(6));
  plot.append("g").attr("class", "axis")
      .call(d3.axisLeft(trendY).ticks(5).tickFormat(v => v / 1000));   // billions
  plot.append("text").attr("class", "annotation").attr("x", 0).attr("y", -12)
      .text("Global CO₂ emissions (billion tonnes / year)");

  trendLine = d3.line().x(d => trendX(d.year)).y(d => trendY(d.co2));
  trendArea = d3.area().x(d => trendX(d.year)).y0(innerH).y1(d => trendY(d.co2));

  // empty paths, filled in trendStep()
  trendAreaPath = plot.append("path").attr("fill", "var(--accent)").attr("opacity", 0.10);
  trendLinePath = plot.append("path").attr("fill", "none")
      .attr("stroke", "var(--accent)").attr("stroke-width", 2.5);

  trendNotes = plot.append("g");   // moving dot + milestone label

  trendStep(0);
}

function trendStep(i){
  const cutoff = TREND_CUTOFFS[i];

  // draw line + area only up to the current cut-off year
  const shown = trendData.filter(d => d.year <= cutoff);
  trendLinePath.datum(shown).transition().duration(800).attr("d", trendLine);
  trendAreaPath.datum(shown).transition().duration(800).attr("d", trendArea);

  // milestone dot + label at the end of the slice
  const last = shown[shown.length - 1];
  trendNotes.selectAll("*").remove();
  if (TREND_LABELS[cutoff]){
    trendNotes.append("circle")
        .attr("cx", trendX(last.year)).attr("cy", trendY(last.co2)).attr("r", 4)
        .attr("fill", "var(--accent)");
    trendNotes.append("text").attr("class", "annotation lead")
        .attr("x", Math.min(trendX(last.year), trendW - 200))
        .attr("y", Math.max(trendY(last.co2) - 12, 12))
        .text(`${last.year} · ${TREND_LABELS[cutoff]}`);
  }
}
