"""Extract the game data the calculator needs from the AoE3 XML into compact JSON.

Reads xml/protoy.xml, xml/techtreey.xml, xml/homecity*.xml and the English string table,
and writes data/units.json, data/techs.json and data/civs.json.
Also copies the card icons the techs use from UI/ into data/icons, shrunk to card size.

    pip install pillow
    python tools/extract_data.py [--game-dir FOLDER_WITH_xml_AND_UI]

Element lookups mirror the browser DOM calls the calculator used to make on the XML:
getElementsByTagName finds the first matching descendant and textContent joins all descendant text.
"""
import argparse
import json
import re
import shutil
import xml.etree.ElementTree as ET
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
# game files extracted into xml/ and UI/; set_game_dir points these elsewhere
XML_DIR = ROOT / "xml"
STRINGS_XML = ROOT / "UI" / "Data" / "strings" / "English" / "stringtabley.xml"
ICON_SOURCE_DIR = ROOT / "UI" / "Data" / "wpfg"
OUT_DIR = ROOT / "data"
ICON_DIR = OUT_DIR / "icons"
# cards are shown at 80px, so this stays sharp on 2x screens
ICON_SIZE = 160
# the game has no age I icon, so this one is made from icon_age_ii.png; it lives here because UI/ isn't tracked
AGE_I_ICON = Path(__file__).resolve().parent / "icon_age_i.png"
INGAME_ICONS = "resources/images/icons/ingame/"
# the age-up techs point at post_game icons that aren't in UI/, so use the ingame age icons
AGE_ICONS = {
    "resources/images/icons/post_game/time_line_age_2.png": INGAME_ICONS + "icon_age_ii.png",
    "resources/images/icons/post_game/time_line_age_3.png": INGAME_ICONS + "icon_age_iii.png",
    "resources/images/icons/post_game/time_line_age_4.png": INGAME_ICONS + "icon_age_iv.png",
    "resources/images/icons/post_game/time_line_age_5.png": INGAME_ICONS + "icon_age_v.png",
}

# name shown in the civ select, homecity file, and the techs a civ starts with
CIVS = [
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
# guard upgrades (RGRedcoats, DERGArbalester, ...) also apply the techs they turn on, e.g. GuardMusketeers
GUARD_UPGRADE = re.compile(r"(DE)?RG[A-Z]")


def set_game_dir(game_dir):
    global XML_DIR, STRINGS_XML, ICON_SOURCE_DIR
    XML_DIR = game_dir / "xml"
    STRINGS_XML = game_dir / "UI" / "Data" / "strings" / "English" / "stringtabley.xml"
    ICON_SOURCE_DIR = game_dir / "UI" / "Data" / "wpfg"


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


def string_for(tech, tag, strings):
    el = first(tech, tag)
    return strings.get(text(el)) if el is not None else None


def extract_tech(tech, strings):
    name = tech.get("name")
    effects_el = first(tech, "effects")
    effects = []
    if effects_el is not None:
        for effect in effects_el:
            effects.append(dict(effect.attrib, targets=[text(t) for t in effect.iter("target")]))
    icon = first(tech, "icon")
    status_techs = []
    if GUARD_UPGRADE.match(name):
        status_techs = [text(e) for e in tech.iter("effect") if e.get("type") == "TechStatus"]
    return {
        "name": name,
        "displayName": string_for(tech, "displaynameid", strings) or name,
        "description": string_for(tech, "rollovertextid", strings) or "",
        "flags": [text(f) for f in tech.iter("flag")],
        "icon": text(icon) if icon is not None else None,
        "effects": effects,
        # techs applied along with this one
        "statusTechs": status_techs,
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


def copy_icons(techs):
    """Copies each card's icon into data/icons and points tech["icon"] at the copy, or None if the game has no such file."""
    shutil.rmtree(ICON_DIR, ignore_errors=True)
    missing = 0
    for tech in techs:
        if tech["icon"] is None:
            # civ starting techs (Age0French etc.) have no icon
            if not re.search("age0", tech["name"], re.I):
                continue
            tech["icon"] = INGAME_ICONS + "icon_age_i.png"
        # icon paths in the XML use backslashes and mixed case
        icon = tech["icon"].replace("\\", "/").lower()
        icon = AGE_ICONS.get(icon, icon)
        source = AGE_I_ICON if icon.endswith("icon_age_i.png") else ICON_SOURCE_DIR / icon
        if not tech["effects"] or not source.exists():
            # techs without effects never show as cards
            missing += bool(tech["effects"])
            tech["icon"] = None
            continue
        # webp is a fraction of the size of the game's png art
        icon = str(Path(icon).with_suffix(".webp").as_posix())
        target = ICON_DIR / icon
        if not target.exists():
            target.parent.mkdir(parents=True, exist_ok=True)
            image = Image.open(source)
            image.thumbnail((ICON_SIZE, ICON_SIZE))
            image.save(target, quality=85)
        tech["icon"] = icon
    size = sum(f.stat().st_size for f in ICON_DIR.rglob("*") if f.is_file())
    print("wrote %s (%d KB), %d icons not found in UI/" % (ICON_DIR.relative_to(ROOT), size // 1024, missing))


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--game-dir", type=Path, default=ROOT, help="folder holding the extracted xml/ and UI/ folders")
    set_game_dir(parser.parse_args().game_dir)

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
    techs = [extract_tech(t, strings) for t in techtree]
    for tech in techs:
        tech["effects"] = [e for e in tech["effects"] if unit_tags.intersection(e["targets"])]
    status_targets = {name for t in techs for name in t["statusTechs"]}
    techs = [t for t in techs if t["effects"] or t["name"] in status_targets]

    OUT_DIR.mkdir(exist_ok=True)
    copy_icons(techs)
    for name, data in [("units", {"units": units, "groups": groups}), ("techs", techs), ("civs", civs)]:
        path = OUT_DIR / (name + ".json")
        path.write_text(json.dumps(data, separators=(",", ":")), encoding="utf-8")
        print("wrote %s (%d KB)" % (path.relative_to(ROOT), path.stat().st_size // 1024))


if __name__ == "__main__":
    main()
