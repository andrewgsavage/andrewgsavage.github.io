import pandas as pd
import xml.etree.ElementTree as ET

#proto_xml=r"C:\Program Files (x86)\Microsoft Games\Age of Empires III\data\protoy.xml"
#techtree_xml=r"C:\Program Files (x86)\Microsoft Games\Age of Empires III\data\techtreey.xml"
# to get homecity xml, go here http://aoe3.heavengames.com/downloads/showfile.php?fileid=3686 and extract data.bar
# homecity_xml=r"C:\Users\A\Downloads\AOE3H\Data\homecityfrench.xml"
from pathlib import Path
import pandas as pd

xml_dir = Path(__file__).parent.parent / "xml" 

proto_xml = xml_dir / "protoy.xml"
techtree_xml = xml_dir / "techtreey.xml"


# protoy has units + tech , costs, stats 
# techtree has what civs get what units

etree = ET.parse(proto_xml) #create an ElementTree object 
proto_root = etree.getroot()
# proto_units = [a for a in proto_units if 
# proto_crate = proto_root.findall('.//*[UnitType="AbstractResourceCrate"]')

# villager_names = set([vil.attrib['name'] for vil in proto_vils])


etree = ET.parse(techtree_xml) #create an ElementTree object 
tech_root = etree.getroot()
tech_ships = tech_root.findall(".//cost[@resourcetype='Ships']...") 

civs = [
  {'name': 'French', 'homecity': 'homecityfrench', },
  {'name': 'Russian', 'homecity': 'homecityrussians', },
  {'name': 'British', 'homecity': 'homecitybritish', },
  {'name': 'Dutch', 'homecity': 'homecitydutch', },
  {'name': 'German', 'homecity': 'homecitygerman', },
  {'name': 'Portuguese', 'homecity': 'homecityportuguese', },
  {'name': 'Ottoman', 'homecity': 'homecityottomans', },
  {'name': 'Spanish', 'homecity': 'homecityspanish', },
  {'name': 'Iroquois', 'homecity': 'homecityxpiroquois', },
  {'name': 'Aztec', 'homecity': 'homecityxpaztec', },
  {'name': 'Sioux', 'homecity': 'homecityxpsioux', },
  {'name': 'Japanese', 'homecity': 'homecityjapanese', },
  {'name': 'Chinese', 'homecity': 'homecitychinese', },
  {'name': 'Indians', 'homecity': 'homecityindians', },
  {'name': 'Inca', 'homecity': 'homecitydeinca', },
  {'name': 'Swedish', 'homecity': 'homecityswedish', },
  ]
  
df_common = pd.DataFrame([{
    'name': ship.attrib['name'],
    'icon': ship.find(".//icon").text
} for ship in tech_ships
], dtype=pd.StringDtype())

data = []

for civ in civs:
    homecity_xml = xml_dir / (civ['homecity'] + ".xml")
    etree = ET.parse(homecity_xml)
    homecity_root = etree.getroot()
    cards = homecity_root.find(".//cards").findall(".//card")
    for card in cards:
        dat = {
            "civ": civ['name'],
            "name": card.find(".name").text,
            "age": int(card.find(".age").text)+1,
            "maxcount": card.find(".maxcount").text,
        }
        try:
            dat["displayunitcount"] = card.find(".displayunitcount").text
        except:
            dat["displayunitcount"] = ""
        data.append(dat)
df = pd.DataFrame(data, dtype=pd.StringDtype())

df = pd.merge(df,df_common,on="name")
df = df.sort_values(["civ","age"])
df.to_json("shipments.json",'records')