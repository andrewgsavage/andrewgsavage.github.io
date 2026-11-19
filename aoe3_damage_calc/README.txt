cd 'F:\A\repos\andrewgsavage.github.io\aoe3_damage_calc'
mkdir .temp

# Use Resource manager to extract data
File -> Open
    F:\SteamLibrary\steamapps\common\AoE3DE\Game\Data\Data.bar
Extract -> All files
    Check xml and png options
    F:\A\repos\andrewgsavage.github.io\aoe3_damage_calc\.temp

rm -r xml
mv .temp/Data xml
rm -r .temp

mkdir .temp


F:\SteamLibrary\steamapps\common\AoE3DE\Game\UI

rm -r UI
mv .temp/Data UI
rm -r .temp


# xml/ and UI/ are not committed; the page only loads what the script below builds from them.
# Build the JSON and card icons the page loads for one game patch (data/PATCH/units.json, techs.json, civs.json, icons/)
# and add the patch to data/patches.json, the patches the page offers, newest first.
# Give a new game patch a new --patch name to keep the older ones selectable; reusing a name overwrites that patch.
# Civs and their starting techs are listed at the top of the script

pip install pillow
python tools/extract_data.py --patch 2026-10 --label "Oct 2026"
# or, when xml/ and UI/ are extracted into another folder
python tools/extract_data.py --patch 2026-10 --label "Oct 2026" --game-dir F:\A\repos\andrewgsavage.github.io\aoe3_damage_calc

# Commands to update data

git add aoe3_damage_calc/data/