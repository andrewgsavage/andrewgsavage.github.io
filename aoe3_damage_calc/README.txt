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
# Rebuild the JSON and card icons the page loads (data/units.json, techs.json, civs.json, data/icons/)
# Civs and their starting techs are listed at the top of the script

pip install pillow
python tools/extract_data.py
# or, when xml/ and UI/ are extracted into another folder
python tools/extract_data.py --game-dir F:\A\repos\andrewgsavage.github.io\aoe3_damage_calc

# Commands to update data

git add aoe3_damage_calc/data/