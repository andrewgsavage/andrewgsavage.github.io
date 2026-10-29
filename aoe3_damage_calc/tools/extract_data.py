"""Extract the game data the calculator needs from the AoE3 XML into compact JSON.

Reads xml/protoy.xml, xml/techtreey.xml, xml/homecity*.xml and the English string table,
and writes data/units.json, data/techs.json and data/civs.json.

    python tools/extract_data.py

Element lookups mirror the browser DOM calls the calculator used to make on the XML:
getElementsByTagName finds the first matching descendant and textContent joins all descendant text.
"""
import json
import re
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
XML_DIR = ROOT / "xml"
STRINGS_XML = ROOT / "UI" / "Data" / "strings" / "English" / "stringtabley.xml"
OUT_DIR = ROOT / "data"

# name shown in the civ select, homecity file, and the techs a civ starts with
CIVS = [
    {"name": "Select Civ", "homecity": "homecityfrench", "techs": ["Age0French", "AAStandardStartingTechs", "HCAdvancedArsenal", "DEGrenadierEnable"]},
    {"name": "French", "homecity": "homecityfrench", "techs": ["Age0French", "AAStandardStartingTechs", "HCAdvancedArsenal", "DEGrenadierEnable", "ColonializeFrench"]},
    {"name": "Russian", "homecity": "homecityrussians", "techs": ["Age0Russian", "AAStandardStartingTechs", "HCAdvancedArsenal", "DEGrenadierEnable"]},
    {"name": "British", "homecity": "homecitybritish", "techs": ["Age0British", "AAStandardStartingTechs", "HCAdvancedArsenal", "DEGrenadierEnable"]},
    {"name": "Dutch", "homecity": "homecitydutch", "techs": ["Age0Dutch", "AAStandardStartingTechs", "HCAdvancedArsenal", "DEGrenadierEnable"]},
    {"name": "German", "homecity": "homecitygerman", "techs": ["Age0German", "AAStandardStartingTechs", "HCAdvancedArsenal", "DEGrenadierEnable", "DEHCLandwehr"]},
    {"name": "Portuguese", "homecity": "homecityportuguese", "techs": ["Age0Portuguese", "AAStandardStartingTechs", "HCAdvancedArsenal", "DEGrenadierEnable"]},
    {"name": "Ottoman", "homecity": "homecityottomans", "techs": ["Age0Ottoman", "AAStandardStartingTechs", "HCAdvancedArsenal", "DEVeteranNizam", "DEGrenadierEnable"]},
    {"name": "Spanish", "homecity": "homecityspanish", "techs": ["Age0Spanish", "AAStandardStartingTechs", "HCAdvancedArsenal", "DEGrenadierEnable"]},
    {"name": "Iroquois", "homecity": "homecityxpiroquois", "techs": ["Age0XPIroquois", "HCXPNewWaysIroquois"]},
    {"name": "Aztec", "homecity": "homecityxpaztec", "techs": ["Age0XPAztec"]},
    {"name": "Sioux", "homecity": "homecityxpsioux", "techs": ["Age0XPSioux", "HCXPNewWaysSioux"]},
    {"name": "Japanese", "homecity": "homecityjapanese", "techs": ["YPAge0JapaneseConsulate", "YPAge0JapaneseBuildings", "YPAge0JapaneseUnits", "YPAge0JapaneseMonks", "YPAge0JapaneseTechs", "YPAge0JapaneseWonders", "YPAge0JapaneseSpecialTechs", "YPAAAsianStartingTechs"]},
    {"name": "Chinese", "homecity": "homecitychinese", "techs": ["YPAge0ChineseConsulate", "YPAge0ChineseBuildings", "YPAge0ChineseUnits", "YPAge0ChineseMonks", "YPAge0ChineseTechs", "YPAge0ChineseWonders", "YPAge0ChineseSpecialTechs", "YPAge0ChineseClone6", "YPAAAsianStartingTechs"]},
    {"name": "Indians", "homecity": "homecityindians", "techs": ["ypAge0IndiansConsulate", "ypAge0IndiansBuildings", "ypAge0IndiansUnits", "ypAge0IndiansMonks", "ypAge0IndiansTechs", "ypAge0IndiansWonders", "ypAge0IndiansSpecialTechs", "YPAAAsianStartingTechs"]},
    {"name": "Inca", "homecity": "homecitydeinca", "techs": ["DEAge0Inca"]},
    {"name": "Swedish", "homecity": "homecityswedish", "techs": ["DEAge0Swedish", "DEGrenadierEnable", "AAStandardStartingTechs", "HCAdvancedArsenal"]},
    {"name": "Americans", "homecity": "homecityamericans", "techs": ["DEAge0Americans", "HCAdvancedArsenal"]},
    {"name": "Hausa", "homecity": "homecityhausa", "techs": ["DEAge0Hausa", "HCAdvancedArsenal"]},
    {"name": "Ethiopians", "homecity": "homecityethiopians", "techs": ["DEAge0Ethiopian", "HCAdvancedArsenal"]},
    {"name": "Mexicans", "homecity": "homecitymexicans", "techs": ["DEAge0Mexicans", "HCAdvancedArsenal"]},
    {"name": "Italians", "homecity": "homecityitalians", "techs": ["DEAge0Italians", "HCAdvancedArsenal"]},
    {"name": "Maltese", "homecity": "homecitymaltese", "techs": ["DEAge0Maltese", "HCAdvancedArsenal"]},
]
# techs every civ can get, on top of its own
COMMON_CIV_TECHS = ["VeteranCuirassierShadow", "Colonialize", "Fortressize", "Industrialize", "Imperialize"]

# unit stats read from protoy; config.js lists which of these the stats table shows
UNIT_STATS = ["populationcount", "maxvelocity", "maxrunvelocity", "turnrate", "maxhitpoints", "los", "trainpoints", "bounty"]
ATTACK_VALUES = ["damage", "maxrange", "rof", "damagecap", "damagearea", "damagebonus"]
# extra unit lists offered to every civ, by the unittype that marks them
UNIT_GROUPS = {"Mercenary": "Mercenary", "Native": "AbstractNativeWarrior", "Consulate": "AbstractConsulateUnit"}


def text(el):
    return "".join(el.itertext())


def first(el, tag):
    return next(el.iter(tag), None)


def parse_float(s):
    # like JavaScript's parseFloat: reads the leading number and ignores the rest
    m = re.match(r"\s*[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?", s or "")
    if not m:
        raise ValueError("not a number: %r" % s)
    return float(m.group(0))


def is_military(tags):
    return "AbstractTownCenter" in tags or ("Military" in tags and "Ship" not in tags)


def extract_unit(unit, strings):
    name = unit.get("name")
    editor_name_id = first(unit, "editornameid")
    display_name = strings.get(text(editor_name_id)) if editor_name_id is not None else None
    stats = {}
    for stat in UNIT_STATS:
        el = first(unit, stat)
        if el is not None:
            stats[stat] = parse_float(text(el))
    attacks = []
    for action in unit.iter("protoaction"):
        if len(action) == 0 or "Attack" not in text(action[0]):
            continue
        values = []
        for item in action:
            if item.tag in ATTACK_VALUES:
                value = [item.tag, parse_float(text(item))]
                if "type" in item.attrib:
                    value.append(item.get("type"))
                values.append(value)
        damage_type = first(action, "damagetype")
        attacks.append({
            "name": text(first(action, "name")),
            # a few odd units (campaign and easter egg ones) have attacks without one
            "damagetype": text(damage_type) if damage_type is not None else None,
            "values": values,
        })
    return {
        "name": name,
        "displayName": display_name or name,
        "tags": [text(t) for t in unit.iter("unittype")],
        "stats": stats,
        "armor": [[a.get("type"), parse_float(a.get("value"))] for a in unit.iter("armor")],
        "costs": [[c.get("resourcetype"), parse_float(text(c))] for c in unit.iter("cost")],
        "attacks": attacks,
    }


def extract_tech(tech):
    effects_el = first(tech, "effects")
    effects = []
    if effects_el is not None:
        for effect in effects_el:
            effects.append(dict(effect.attrib, targets=[text(t) for t in effect.iter("target")]))
    icon = first(tech, "icon")
    return {
        "name": tech.get("name"),
        "flags": [text(f) for f in tech.iter("flag")],
        "icon": text(icon) if icon is not None else None,
        "effects": effects,
        # techs this one turns on, e.g. the techs bundled into a revolution
        "statusTechs": [text(e) for e in tech.iter("effect") if e.get("type") == "TechStatus"],
    }


def civ_data(civ, techs_by_name, military_names):
    effects = [e for name in civ["techs"] for e in techs_by_name[name].iter("effect")]
    status_techs = [text(e) for e in effects if e.get("type") == "TechStatus"]
    homecity = ET.parse(XML_DIR / (civ["homecity"] + ".xml")).getroot()
    cards = [text(first(card, "name")) for card in first(homecity, "cards").iter("card")]
    # units enabled by the starting techs
    units = []
    for e in effects:
        if e.get("type") == "Data" and len(e) and text(e[0]) in military_names and text(e[0]) not in units:
            units.append(text(e[0]))
    return {
        "name": civ["name"],
        "techs": status_techs + civ["techs"] + cards + COMMON_CIV_TECHS,
        "units": units,
    }


def main():
    strings_root = ET.parse(STRINGS_XML).getroot()
    strings = {s.get("_locid"): text(s) for s in strings_root[0]}

    proto = ET.parse(XML_DIR / "protoy.xml").getroot()
    military = [u for u in proto if is_military([text(t) for t in u.iter("unittype")])]
    units = [extract_unit(u, strings) for u in military]
    military_names = {u["name"] for u in units}
    groups = {label: sorted(u["name"] for u in units if tag in u["tags"]) for label, tag in UNIT_GROUPS.items()}

    techtree = ET.parse(XML_DIR / "techtreey.xml").getroot()
    techs_by_name = {}
    for tech in techtree:
        techs_by_name.setdefault(tech.get("name"), tech)
    civs = [civ_data(civ, techs_by_name, military_names) for civ in CIVS]

    # keep only units some civ can pick
    selectable = {name for civ in civs for name in civ["units"]} | {name for names in groups.values() for name in names}
    units = [u for u in units if u["name"] in selectable]

    # only effects that can reach a military unit matter, and only techs that keep one, or are turned on by another
    unit_tags = {tag for u in units for tag in u["tags"] + [u["name"]]}
    techs = [extract_tech(t) for t in techtree]
    for tech in techs:
        tech["effects"] = [e for e in tech["effects"] if unit_tags.intersection(e["targets"])]
    status_targets = {name for t in techs for name in t["statusTechs"]}
    techs = [t for t in techs if t["effects"] or t["name"] in status_targets]

    OUT_DIR.mkdir(exist_ok=True)
    for name, data in [("units", {"units": units, "groups": groups}), ("techs", techs), ("civs", civs)]:
        path = OUT_DIR / (name + ".json")
        path.write_text(json.dumps(data, separators=(",", ":")), encoding="utf-8")
        print("wrote %s (%d KB)" % (path.relative_to(ROOT), path.stat().st_size // 1024))


if __name__ == "__main__":
    main()
