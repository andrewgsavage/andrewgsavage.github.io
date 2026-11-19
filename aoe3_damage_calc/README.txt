Adding a new game patch to the calculator
=========================================

The page loads one folder per game patch, data/PATCH/ (units.json, techs.json, civs.json, icons/),
listed newest first in data/patches.json. Each export adds a new patch; the older ones stay selectable.
xml/ and UI/ (the extracted game files) are not committed.

Commands are for PowerShell, run from C:\Users\A\repos\andrewgsavage.github.io\aoe3_damage_calc


1. Extract the game files (Resource Manager, both bars)

   File -> Open   F:\SteamLibrary\steamapps\common\AoE3DE\Game\Data\Data.bar
   Extract -> All files, xml and png options checked, into
                  C:\Users\A\repos\andrewgsavage.github.io\aoe3_damage_calc\.temp\xml

   File -> Open   F:\SteamLibrary\steamapps\common\AoE3DE\Game\UI\UIResources1.bar
   Extract -> All files, xml and png options checked, into
                  C:\Users\A\repos\andrewgsavage.github.io\aoe3_damage_calc\.temp\UI

   Data.bar gives the units, techs, home cities and string table; UIResources1.bar gives the card icons.
   Then swap them in place of the previous extract, leaving .temp empty for next time:

   Remove-Item -Recurse -Force xml, UI -ErrorAction SilentlyContinue
   Move-Item .temp\xml\Data xml
   Move-Item .temp\UI UI
   Remove-Item -Recurse -Force .temp\*

   Check: xml\protoy.xml, xml\strings\English\stringtabley.xml and UI\Data\wpfg\resources exist.


2. Build the patch's data

   Pick a new patch name (the folder under data/ and the id in shared links) and a label for the dropdown.
   Reusing an existing name overwrites that patch.

   pip install pillow
   python tools\extract_data.py --patch 2026-11 --label "Nov 2026"

   This writes data\2026-11\ and puts the patch first in data\patches.json, so it becomes the default.
   Civs and their starting techs are listed at the top of tools\extract_data.py.
   If xml/ and UI/ were extracted somewhere else, add --game-dir FOLDER_HOLDING_xml_AND_UI.


3. Check and commit

   python -m http.server 8765    then open http://localhost:8765 and pick the new patch on one side

   git add data
   git commit -m "Add Nov 2026 patch data"
