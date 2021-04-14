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

data = [{
    ship[]
} for ship in tech_ships
]
##################
## find french units 

proto_units = proto_root.findall('.//*[UnitType="Military"]')
proto_unit_names = [unit.attrib['name'] for unit in proto_units]

civ_units =tech_root.find(".//Tech[@name='Age0French']").findall(".//Target[@type='ProtoUnit']")

civ_units = [unit for unit in civ_units if unit.text in proto_unit_names]
for unit in civ_units:
    print(unit.text)

dragoon = proto_root.find(".//Unit[@name='Dragoon']")
dragoon.findall("Cost")

#################
## find military techs

# tech that affects a tag
tech_mil = tech_root.findall(".//Effect[Target='AbstractLightCavalry']....") 
# tech that affects a unit
tech_mil = tech_root.findall(".//Effect[Target='Dragoon']....") 


tech_ships[0]
