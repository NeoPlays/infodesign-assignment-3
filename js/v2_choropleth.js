/* View 2 - World map of CO2 per person (choropleth).
   Interactions: year slider, hover tooltip, country dropdown highlight. */

let mapPaths, mapById, mapYear = 2022, mapColor;

// which year each scroll step shows
const MAP_STEP_YEARS = [1900, 1950, 1990, 2022];

// world-atlas ids are zero-padded ("004"); our data uses plain numbers ("4").
// Strip the padding so the two match.
function idKey(id){ return String(+id); }

// look up a country's per-capita value for the current year
function mapValue(numericId){
  const rec = mapById.get(idKey(numericId));
  if (!rec) return null;
  const v = rec.vals[String(mapYear)];
  return (v === undefined) ? null : v;
}

function drawMap(){
  mapById = new Map(Object.entries(DATA.choro.data));

  const box = size("v2-chart");

  // TopoJSON -> GeoJSON features, dropping Antarctica (id 10) so it frames nicely
  const world = DATA.world;
  const features = topojson.feature(world, world.objects.countries).features
      .filter(f => f.id != 10);

  // fitWidth fills the available width; height follows from the projection
  const projection = d3.geoNaturalEarth1().fitWidth(box.width * 0.97, {
    type: "FeatureCollection", features: features
  });
  const path = d3.geoPath(projection);

  const [[, ], [, y1]] = path.bounds({ type: "FeatureCollection", features });
  const mapH = Math.ceil(y1) + 46; // +46 room for the legend below

  const svg = d3.select("#v2-chart").append("svg")
      .attr("viewBox", `0 0 ${box.width} ${mapH}`)
      .style("height", "auto");

  // 0..25 t split into 5 colour bins
  mapColor = d3.scaleQuantize().domain([0, 25]).range(REDS);

  // one <path> per country
  mapPaths = svg.append("g").selectAll("path").data(features).join("path")
      .attr("d", path)
      .attr("stroke", "#ffffff").attr("stroke-width", 0.4)
      .on("mousemove", function(event, f){
        const rec = mapById.get(idKey(f.id));
        const v = mapValue(f.id);
        showTooltip(
          `<div class="tt-title">${rec ? rec.name : f.properties.name}</div>
           <div>${mapYear} · <span class="tt-val">${v == null ? "no data" : formatTonnes(v) + " t"}</span> CO₂ / person</div>`,
          event);
      })
      .on("mouseleave", hideTooltip);

  drawMapLegend(svg, box.width, mapH);

  // year slider under the map
  const slider = document.getElementById("v2-slider");
  slider.addEventListener("input", e => setMapYear(+e.target.value));

  setMapYear(2022);

  // populate and wire up the country dropdown
  const countrySelect = document.getElementById("v2-country-select");
  [...mapById.values()]
    .filter(c => c.name && c.iso3 && Object.keys(c.vals || {}).length > 0)
    .sort((a, b) => d3.ascending(a.name, b.name))
    .forEach(c => {
      const opt = document.createElement("option");
      opt.value = c.iso3;
      opt.textContent = c.name;
      countrySelect.appendChild(opt);
    });
  countrySelect.addEventListener("change", function(e){
    highlightMap(e.target.value || null);
  });
}

// ---- recolour all countries for the current year ----
function setMapYear(year){
  mapYear = year;
  document.getElementById("v2-year-label").textContent = year;
  document.getElementById("v2-slider").value = year;
  mapPaths.transition().duration(400).attr("fill", function(f){
    const v = mapValue(f.id);
    return v == null ? "#ececf0" : mapColor(v);   // grey = no data
  });
}

// ---- highlight the selected country (called by the dropdown) ----
function highlightMap(iso){
  mapPaths
    .attr("stroke", function(f){
      const rec = mapById.get(idKey(f.id));
      return (rec && rec.iso3 === iso) ? "#1d1d1f" : "#ffffff";
    })
    .attr("stroke-width", function(f){
      const rec = mapById.get(idKey(f.id));
      return (rec && rec.iso3 === iso) ? 2 : 0.4;
    });
  // bring the selected country to the front so its outline isn't overdrawn
  mapPaths.filter(function(f){
    const rec = mapById.get(idKey(f.id));
    return rec && rec.iso3 === iso;
  }).raise();
}

// ---- scroll step: move the year ----
function mapStep(i){ setMapYear(MAP_STEP_YEARS[i]); }

// ---- colour legend (5 swatches) ----
function drawMapLegend(svg, w, h){
  const g = svg.append("g").attr("class", "legend")
      .attr("transform", `translate(${w * 0.04}, ${h - 26})`);
  const swatch = 26;
  REDS.forEach((color, i) => {
    g.append("rect").attr("x", i * swatch).attr("width", swatch).attr("height", 8)
      .attr("fill", color);
  });
  g.append("text").attr("y", -6).text("CO₂ per person (t/year)");
  g.append("text").attr("y", 22).attr("x", 0).text("0");
  g.append("text").attr("y", 22).attr("x", REDS.length * swatch).attr("text-anchor", "end").text("25+");
}
