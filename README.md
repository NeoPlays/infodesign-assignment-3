# Who Owes the Atmosphere? - Carbon Inequality

An interactive **visual storytelling** web app about who is responsible for CO₂
emissions across countries, wealth and 270 years of history.
Final project for *VU 193.020 Fundamentals of Visualization*, TU Wien - Group 15.

## The story (6 narrative views)

1. **The scale of the crisis** - animated line chart of global CO₂ (1750-2023).
2. **Who emits - per person?** - choropleth map with a year slider.
3. **The historical debt** - treemap of cumulative CO₂.
4. **What drives a country?** - stacked area chart with a country dropdown.
5. **Does wealth require pollution?** - bubble scatter (GDP x CO₂ x population) with a country dropdown.
6. **The 500-fold gap** - sorted bar chart of the per-capita emissions gap, with a country dropdown.

## Tech

- **D3.js v7**, **TopoJSON** for the map and **Scrollama** for scrollytelling.
- No build step and no framework - just `index.html` plus plain `<script>` files.
- Libraries and the world basemap load from a CDN; the CO₂ data is pre-processed
  into static JSON files in `data/`.

## Run locally

### Requirements

- **Python 3** (3.6 or newer) - used only to start a local web server.
  Check with `python3 --version`.
- A modern web browser (Chrome, Firefox, Edge or Safari).
- An internet connection on first load - D3.js, TopoJSON, Scrollama and the
  world basemap are fetched from a CDN at runtime.

No `npm install`, build step or extra packages are needed: the app is plain
HTML, CSS and JavaScript, and the data is already pre-processed in `data/`.

### Steps

1. **Clone the repository** and enter the project folder:

   ```bash
   git clone <repo-url>
   cd infodesign-assignment-3
   ```

2. **Start a local web server** from the project root. The app loads its JSON
   via `fetch`, which browsers block when opening `index.html` directly from
   disk (`file://`), so a server is required:

   ```bash
   python3 -m http.server 8000
   ```

   (On Windows you may need `py -m http.server 8000`.)

3. **Open the app** in your browser:

   ```
   http://localhost:8000
   ```

4. **Stop the server** when you are done with `Ctrl+C` in the terminal.

## Regenerate the data (optional)

The repository already ships the pre-processed JSON in `data/`, so this step is
**not** required to run the app. To rebuild it from the raw dataset:

1. Download the OWID dataset (`owid-co2-data.csv`) from
   https://github.com/owid/co2-data.
2. Run the preprocessing script (standard-library Python only, no extra
   dependencies), pointing it at the CSV:

   ```bash
   cd scripts
   CO2_CSV=/path/to/owid-co2-data.csv python3 preprocess.py
   ```

   The regenerated JSON files are written to `data/`.

## Data source

Our World in Data - *CO₂ and Greenhouse Gas Emissions* (Ritchie, Roser, Rosado),
https://github.com/owid/co2-data

## CO₂ Copy Pasta
```
CO₂
```
