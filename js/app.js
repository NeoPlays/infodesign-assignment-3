/* app.js - load the data, draw every chart, wire up scrolling.
   Loaded last, so all draw/step functions already exist. */

const WORLD_MAP_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// load all the JSON files at once, then start
Promise.all([
  d3.json("data/global_trend.json"),
  d3.json("data/choropleth.json"),
  d3.json("data/treemap.json"),
  d3.json("data/country_profiles.json"),
  d3.json("data/scatter.json"),
  d3.json("data/inequality.json"),
  d3.json(WORLD_MAP_URL)
]).then(function(files){
  // store the data so every chart can read it (util.js -> DATA)
  DATA.trend      = files[0];
  DATA.choro      = files[1];
  DATA.tree       = files[2];
  DATA.profiles   = files[3];
  DATA.scatter    = files[4];
  DATA.inequality = files[5];
  DATA.world      = files[6];

  drawTrend();
  drawMap();
  drawTreemap();
  drawProfile();
  drawScatter();
  drawInequality();

  setupScrolly();
}).catch(function(error){
  console.error(error);
  document.getElementById("v1-chart").innerHTML =
    "<p style='padding:2rem;color:#6e6e73'>Could not load the data. Please run a local " +
    "web server (see README): <code>python3 -m http.server</code></p>";
});

// connect the right step function to each <section> of the story
const STEP_FUNCTIONS = {
  v1: trendStep,
  v2: mapStep,
  v3: treemapStep,
  v4: profileStep,
  v5: scatterStep,
  v6: inequalityStep
};

// Scrollama watches the ".step" blocks and reports which view + step is in view.
function setupScrolly(){
  const fill  = document.getElementById("progress-fill");
  const track = document.querySelector("#progress .progress-track");
  let activeView = null;

  // grow the rail fill so it ends exactly at the active checkpoint
  function fillToActiveDot(){
    if (!activeView) { fill.style.height = "0%"; return; }
    const dot = document.querySelector('#progress .progress-dot[data-view="' + activeView + '"]');
    if (!dot) return;
    const trackBox = track.getBoundingClientRect();
    const dotBox   = dot.getBoundingClientRect();
    const offset   = (dotBox.top + dotBox.height / 2) - trackBox.top;
    const pct      = (offset / trackBox.height) * 100;
    fill.style.height = Math.max(0, Math.min(100, pct)) + "%";
  }

  const scroller = scrollama();
  scroller.setup({ step: ".step", offset: 0.6 }).onStepEnter(function(response){
    const view = response.element.dataset.view;
    const step = +response.element.dataset.step;

    // highlight the active text block within this view
    document.querySelectorAll('.step[data-view="' + view + '"]').forEach(function(el){
      el.classList.toggle("is-active", el === response.element);
    });

    // light up the rail: active checkpoint + everything up to it is "passed"
    activeView = view;
    const dots = [...document.querySelectorAll("#progress .progress-dot")];
    const activeIndex = dots.findIndex(d => d.dataset.view === view);
    dots.forEach(function(dot, i){
      dot.classList.toggle("is-active", i === activeIndex);
      dot.classList.toggle("is-passed", i <= activeIndex);
    });
    fillToActiveDot();

    STEP_FUNCTIONS[view](step);
  });

  window.addEventListener("resize", function(){ scroller.resize(); fillToActiveDot(); });
}
