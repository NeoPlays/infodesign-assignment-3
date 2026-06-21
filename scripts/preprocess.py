#!/usr/bin/env python3
"""
Preprocess the Our World in Data CO2 dataset into small, view-specific JSON files.

Input : owid-co2-data.csv  (OWID, https://github.com/owid/co2-data)
Output: ../data/*.json  (one slim file per scrollytelling view)

We only keep the ~12 columns the visualisation actually uses and round numbers
to keep the payload small enough to ship in a static GitHub Pages site.

Run:  python3 scripts/preprocess.py
"""
import csv, json, os, math

# --- paths -----------------------------------------------------------------
HERE = os.path.dirname(os.path.abspath(__file__))
# CSV lives in the Assignment 2 folder; adjust if you move it.
CSV = os.environ.get("CO2_CSV") or os.path.normpath(os.path.join(
    HERE, "..", "..", "data", "owid-co2-data.csv"))
OUT = os.path.normpath(os.path.join(HERE, "..", "data"))
os.makedirs(OUT, exist_ok=True)

# --- ISO alpha-3 -> (UN numeric id used by world-atlas, continent) ---------
# Numeric ids match topojson world-atlas countries-110m feature ids.
ISO = {
 "AFG":(4,"Asia"),"ALB":(8,"Europe"),"DZA":(12,"Africa"),"AGO":(24,"Africa"),
 "ARG":(32,"South America"),"ARM":(51,"Asia"),"AUS":(36,"Oceania"),"AUT":(40,"Europe"),
 "AZE":(31,"Asia"),"BGD":(50,"Asia"),"BLR":(112,"Europe"),"BEL":(56,"Europe"),
 "BEN":(204,"Africa"),"BOL":(68,"South America"),"BIH":(70,"Europe"),"BWA":(72,"Africa"),
 "BRA":(76,"South America"),"BGR":(100,"Europe"),"BFA":(854,"Africa"),"BDI":(108,"Africa"),
 "KHM":(116,"Asia"),"CMR":(120,"Africa"),"CAN":(124,"North America"),"TCD":(148,"Africa"),
 "CHL":(152,"South America"),"CHN":(156,"Asia"),"COL":(170,"South America"),"COG":(178,"Africa"),
 "COD":(180,"Africa"),"CRI":(188,"North America"),"CIV":(384,"Africa"),"HRV":(191,"Europe"),
 "CUB":(192,"North America"),"CYP":(196,"Asia"),"CZE":(203,"Europe"),"DNK":(208,"Europe"),
 "DOM":(214,"North America"),"ECU":(218,"South America"),"EGY":(818,"Africa"),"SLV":(222,"North America"),
 "ERI":(232,"Africa"),"EST":(233,"Europe"),"ETH":(231,"Africa"),"FIN":(246,"Europe"),
 "FRA":(250,"Europe"),"GAB":(266,"Africa"),"GMB":(270,"Africa"),"GEO":(268,"Asia"),
 "DEU":(276,"Europe"),"GHA":(288,"Africa"),"GRC":(300,"Europe"),"GTM":(320,"North America"),
 "GIN":(324,"Africa"),"GUY":(328,"South America"),"HTI":(332,"North America"),"HND":(340,"North America"),
 "HUN":(348,"Europe"),"ISL":(352,"Europe"),"IND":(356,"Asia"),"IDN":(360,"Asia"),
 "IRN":(364,"Asia"),"IRQ":(368,"Asia"),"IRL":(372,"Europe"),"ISR":(376,"Asia"),
 "ITA":(380,"Europe"),"JAM":(388,"North America"),"JPN":(392,"Asia"),"JOR":(400,"Asia"),
 "KAZ":(398,"Asia"),"KEN":(404,"Africa"),"PRK":(408,"Asia"),"KOR":(410,"Asia"),
 "KWT":(414,"Asia"),"KGZ":(417,"Asia"),"LAO":(418,"Asia"),"LVA":(428,"Europe"),
 "LBN":(422,"Asia"),"LBR":(430,"Africa"),"LBY":(434,"Africa"),"LTU":(440,"Europe"),
 "LUX":(442,"Europe"),"MKD":(807,"Europe"),"MDG":(450,"Africa"),"MWI":(454,"Africa"),
 "MYS":(458,"Asia"),"MLI":(466,"Africa"),"MRT":(478,"Africa"),"MEX":(484,"North America"),
 "MDA":(498,"Europe"),"MNG":(496,"Asia"),"MNE":(499,"Europe"),"MAR":(504,"Africa"),
 "MOZ":(508,"Africa"),"MMR":(104,"Asia"),"NAM":(516,"Africa"),"NPL":(524,"Asia"),
 "NLD":(528,"Europe"),"NZL":(554,"Oceania"),"NIC":(558,"North America"),"NER":(562,"Africa"),
 "NGA":(566,"Africa"),"NOR":(578,"Europe"),"OMN":(512,"Asia"),"PAK":(586,"Asia"),
 "PAN":(591,"North America"),"PNG":(598,"Oceania"),"PRY":(600,"South America"),"PER":(604,"South America"),
 "PHL":(608,"Asia"),"POL":(616,"Europe"),"PRT":(620,"Europe"),"QAT":(634,"Asia"),
 "ROU":(642,"Europe"),"RUS":(643,"Europe"),"RWA":(646,"Africa"),"SAU":(682,"Asia"),
 "SEN":(686,"Africa"),"SRB":(688,"Europe"),"SLE":(694,"Africa"),"SVK":(703,"Europe"),
 "SVN":(705,"Europe"),"SOM":(706,"Africa"),"ZAF":(710,"Africa"),"SSD":(728,"Africa"),
 "ESP":(724,"Europe"),"LKA":(144,"Asia"),"SDN":(729,"Africa"),"SUR":(740,"South America"),
 "SWE":(752,"Europe"),"CHE":(756,"Europe"),"SYR":(760,"Asia"),"TWN":(158,"Asia"),
 "TJK":(762,"Asia"),"TZA":(834,"Africa"),"THA":(764,"Asia"),"TGO":(768,"Africa"),
 "TTO":(780,"North America"),"TUN":(788,"Africa"),"TUR":(792,"Asia"),"TKM":(795,"Asia"),
 "UGA":(800,"Africa"),"UKR":(804,"Europe"),"ARE":(784,"Asia"),"GBR":(826,"Europe"),
 "USA":(840,"North America"),"URY":(858,"South America"),"UZB":(860,"Asia"),"VEN":(862,"South America"),
 "VNM":(704,"Asia"),"YEM":(887,"Asia"),"ZMB":(894,"Africa"),"ZWE":(716,"Africa"),
}

def num(x):
    try:
        if x is None or x == "":
            return None
        return float(x)
    except ValueError:
        return None

def r(x, d=2):
    return None if x is None else round(x, d)

# --- load ------------------------------------------------------------------
rows = []
with open(CSV, newline="") as f:
    for row in csv.DictReader(f):
        rows.append(row)
print(f"loaded {len(rows)} rows")

# === 1. Global trend (View 1) =========================================
trend = []
for row in rows:
    if row["country"] == "World" and row["co2"]:
        y = int(float(row["year"]))
        if 1750 <= y <= 2023:
            trend.append({"year": y, "co2": r(num(row["co2"]), 1)})
trend.sort(key=lambda d: d["year"])
json.dump(trend, open(os.path.join(OUT, "global_trend.json"), "w"))
print(f"global_trend.json: {len(trend)} years")

# === Helper: only real countries (have iso in our map) =====================
def is_country(row):
    return row["iso_code"] in ISO

# === 2. Choropleth: co2_per_capita per country per year (View 2) ===========
YEARS_MAP = list(range(1900, 2024))
choro = {}
for row in rows:
    if not is_country(row):
        continue
    y = int(float(row["year"]))
    if y not in YEARS_MAP:
        continue
    pc = num(row["co2_per_capita"])
    if pc is None:
        continue
    iso = row["iso_code"]
    nid, cont = ISO[iso]
    rec = choro.setdefault(str(nid), {"name": row["country"], "iso3": iso, "vals": {}})
    rec["vals"][str(y)] = r(pc, 2)
json.dump({"years": YEARS_MAP, "data": choro},
          open(os.path.join(OUT, "choropleth.json"), "w"))
print(f"choropleth.json: {len(choro)} countries x {len(YEARS_MAP)} yrs")

# === 3. Treemap: cumulative CO2 (historical debt, View 3) ==================
latest = {}
for row in rows:
    if not is_country(row):
        continue
    y = int(float(row["year"]))
    cum = num(row["cumulative_co2"])
    if cum is None:
        continue
    iso = row["iso_code"]
    if iso not in latest or y > latest[iso]["year"]:
        latest[iso] = {"year": y, "name": row["country"], "iso3": iso,
                       "cumulative": cum,
                       "share": num(row["share_global_cumulative_co2"])}
items = sorted(latest.values(), key=lambda d: d["cumulative"], reverse=True)
top = items[:40]
rest = sum(d["cumulative"] for d in items[40:])
tree = [{"name": d["name"], "iso3": d["iso3"],
         "cumulative": r(d["cumulative"], 1),
         "share": r(d["share"], 2) if d["share"] is not None else None} for d in top]
tree.append({"name": "Rest of World", "iso3": "ROW",
             "cumulative": r(rest, 1), "share": None})
json.dump(tree, open(os.path.join(OUT, "treemap.json"), "w"))
print(f"treemap.json: {len(tree)} blocks")

