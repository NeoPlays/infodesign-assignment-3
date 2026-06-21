/* View 4 - What drives a country's emissions? (stacked area by fuel source).
   A dropdown picks any country; scrolling pre-selects a few examples. */

let profSvg, profPlot, profX, profY, profInnerW, profInnerH;

const FUELS = ["coal", "oil", "gas", "cement", "flaring"];

// which country each scroll step pre-selects
const PROFILE_PRESET = { 0: "USA", 1: "USA", 2: "CHN", 3: "NOR" };

function drawProfile(){
  const box = size("v4-chart");
  profSvg = d3.select("#v4-chart").append("svg")
      .attr("viewBox", `0 0 ${box.width} ${box.height}`);
  profPlot = profSvg.append("g")
      .attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);
  profInnerW = box.width  - MARGIN.left - MARGIN.right;
  profInnerH = box.height - MARGIN.top  - MARGIN.bottom;

  // empty scales + axes; the data sets the domains later
  profX = d3.scaleLinear().range([0, profInnerW]);
  profY = d3.scaleLinear().range([profInnerH, 0]);
  profPlot.append("g").attr("class", "axis x").attr("transform", `translate(0,${profInnerH})`);
  profPlot.append("g").attr("class", "axis y");
  profPlot.append("text").attr("class", "chart-title").attr("x", 0).attr("y", -12);
  profPlot.append("text").attr("class", "annotation lead driver")
      .attr("x", profInnerW).attr("y", -12).attr("text-anchor", "end");

  // fill the dropdown with all countries, sorted by name
  const select = d3.select("#v4-select");
  const countries = Object.values(DATA.profiles).sort((a, b) => d3.ascending(a.name, b.name));
  select.selectAll("option").data(countries).join("option")
      .attr("value", d => d.iso3).text(d => d.name);
  select.on("change", e => renderProfile(e.target.value));

  // fuel-colour legend
  const legend = profSvg.append("g").attr("class", "legend")
      .attr("transform", `translate(${MARGIN.left},${box.height - 20})`);
  FUELS.forEach((fuel, i) => {
    const g = legend.append("g").attr("transform", `translate(${i * 86},0)`);
    g.append("rect").attr("width", 11).attr("height", 11).attr("rx", 2).attr("fill", FUEL_COLORS[fuel]);
    g.append("text").attr("x", 15).attr("y", 10).text(fuel);
  });

  renderProfile("USA");
}

// draw the stacked area for one country
function renderProfile(iso){
  const country = DATA.profiles[iso];
  if (!country) return;
  document.getElementById("v4-select").value = iso;

  const series = country.series;             // [{year, coal, oil, gas, ...}, ...]
  profX.domain(d3.extent(series, d => d.year));

  // stack the fuel layers
  const stacked = d3.stack().keys(FUELS).value((d, key) => d[key] || 0)(series);
  profY.domain([0, d3.max(stacked[stacked.length - 1], d => d[1]) || 1]).nice();

  const area = d3.area().x(d => profX(d.data.year)).y0(d => profY(d[0])).y1(d => profY(d[1]));

  // one filled <path> per fuel layer, keyed by fuel name
  profPlot.selectAll(".layer").data(stacked, d => d.key).join(
    enter => enter.append("path").attr("class", "layer")
                  .attr("fill", d => FUEL_COLORS[d.key]).attr("d", area),
    update => update.transition().duration(600).attr("d", area)
  );

  profPlot.select(".axis.x").transition().duration(400)
      .call(d3.axisBottom(profX).tickFormat(d3.format("d")).ticks(6));
  profPlot.select(".axis.y").transition().duration(400)
      .call(d3.axisLeft(profY).ticks(5).tickFormat(v => v >= 1000 ? v / 1000 + "k" : v));

  profPlot.select(".chart-title").text(`${country.name}: CO₂ by source (Mt / year)`);

  // biggest source in the latest year = the "top driver"
  const latest = series[series.length - 1];
  let top = FUELS[0];
  FUELS.forEach(f => { if ((latest[f] || 0) > (latest[top] || 0)) top = f; });
  const total = FUELS.reduce((sum, f) => sum + (latest[f] || 0), 0) || 1;
  profPlot.select(".driver")
      .attr("fill", FUEL_COLORS[top])
      .text(`Top driver: ${top} (${Math.round((latest[top] || 0) / total * 100)}%)`);
}

// scroll step: pre-select an example country
function profileStep(i){ renderProfile(PROFILE_PRESET[i]); }
