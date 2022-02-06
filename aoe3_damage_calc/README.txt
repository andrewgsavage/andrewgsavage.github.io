cd 'C:\Users\A\repos\andrewgsavage.github.io\aoe3_damage_calc'
mkdir .temp

# Use Resource manager to extract data
File -> Open
    C:\Program Files (x86)\Steam\steamapps\common\AoE3DE\Game\Data\Data.bar
Extract -> All files
    Check xml and png options
    C:\Users\A\repos\andrewgsavage.github.io\aoe3_damage_calc\.temp

rm -r xml
mv .temp/Data xml
rm -r .temp

mkdir .temp


C:\Program Files (x86)\Steam\steamapps\common\AoE3DE\Game\UI

rm -r UI
mv .temp/Data UI
rm -r .temp

    
# Commands to update data
    
git add -f aoe3_damage_calc/xml/homecity*.xml
git add -f aoe3_damage_calc/xml/protoy.xml
git add -f aoe3_damage_calc/xml/techtreey.xml
git add -f aoe3_damage_calc/UI/Data/wpfg/resources/images/icons/techs/
git add -f aoe3_damage_calc/UI/Data/wpfg/resources/images/icons/techs/native/
git add -f aoe3_damage_calc/UI/Data/wpfg/resources/images/icons/ingame/
git add -f aoe3_damage_calc/UI/Data/wpfg/resources/images/icons/home_city/