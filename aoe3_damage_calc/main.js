
let attacNamesToDelete =['BuildingAttack', 'CoverBuildingAttack', 'RangedDefendBuildingAttack', 'DefendBuildingAttack', 'ChopAttack', 'HandAttackCrate', 'RangedBuildingAttack', 'LanceHandAttack', 'GuardianAttack', 'MortarBuildingAttack', 'TrampleHandAttack']

let civs = [
  {name: 'Select Civ', homecity: 'homecityfrench', techs: ['Age0French', 'AAStandardStartingTechs', 'HCAdvancedArsenal', 'DEGrenadierEnable'] },
  {name: 'French', homecity: 'homecityfrench', techs: ['Age0French', 'AAStandardStartingTechs', 'HCAdvancedArsenal', 'DEGrenadierEnable', 'ColonializeFrench'] },
  {name: 'Russian', homecity: 'homecityrussians', techs: ['Age0Russian', 'AAStandardStartingTechs', 'HCAdvancedArsenal', 'DEGrenadierEnable']},
  {name: 'British', homecity: 'homecitybritish', techs: ['Age0British', 'AAStandardStartingTechs', 'HCAdvancedArsenal', 'DEGrenadierEnable']},
  {name: 'Dutch', homecity: 'homecitydutch', techs: ['Age0Dutch', 'AAStandardStartingTechs', 'HCAdvancedArsenal', 'DEGrenadierEnable']},
  {name: 'German', homecity: 'homecitygerman', techs: ['Age0German', 'AAStandardStartingTechs', 'HCAdvancedArsenal', 'DEGrenadierEnable', 'DEHCLandwehr']},
  {name: 'Portuguese', homecity: 'homecityportuguese', techs: ['Age0Portuguese', 'AAStandardStartingTechs', 'HCAdvancedArsenal', 'DEGrenadierEnable']},
  {name: 'Ottoman', homecity: 'homecityottomans', techs: ['Age0Ottoman', 'AAStandardStartingTechs', 'HCAdvancedArsenal', 'DEVeteranNizam', 'DEGrenadierEnable']},
  {name: 'Spanish', homecity: 'homecityspanish', techs: ['Age0Spanish', 'AAStandardStartingTechs', 'HCAdvancedArsenal', 'DEGrenadierEnable']},
  {name: 'Iroquois', homecity: 'homecityxpiroquois', techs: ['Age0XPIroquois', 'HCXPNewWaysIroquois', ]},
  {name: 'Aztec', homecity: 'homecityxpaztec', techs: ['Age0XPAztec', ]},
  {name: 'Sioux', homecity: 'homecityxpsioux', techs: ['Age0XPSioux', 'HCXPNewWaysSioux', ]},
  {name: 'Japanese', homecity: 'homecityjapanese', techs: ["YPAge0JapaneseConsulate", "YPAge0JapaneseBuildings", "YPAge0JapaneseUnits", "YPAge0JapaneseMonks", "YPAge0JapaneseTechs", "YPAge0JapaneseWonders", "YPAge0JapaneseSpecialTechs", , "YPAAAsianStartingTechs"]},
  {name: 'Chinese', homecity: 'homecitychinese', techs: ["YPAge0ChineseConsulate", "YPAge0ChineseBuildings", "YPAge0ChineseUnits", "YPAge0ChineseMonks", "YPAge0ChineseTechs", "YPAge0ChineseWonders", "YPAge0ChineseSpecialTechs", "YPAge0ChineseClone6", "YPAAAsianStartingTechs"]},
  {name: 'Indians', homecity: 'homecityindians', techs: ["ypAge0IndiansConsulate", "ypAge0IndiansBuildings", "ypAge0IndiansUnits", "ypAge0IndiansMonks", "ypAge0IndiansTechs", "ypAge0IndiansWonders", "ypAge0IndiansSpecialTechs", "YPAAAsianStartingTechs"]},
  {name: 'Inca', homecity: 'homecitydeinca', techs: ['DEAge0Inca', ]},
  {name: 'Swedish', homecity: 'homecityswedish', techs: ['DEAge0Swedish', 'DEGrenadierEnable', 'AAStandardStartingTechs', 'HCAdvancedArsenal']},
  {name: 'Americans', homecity: 'homecityamericans', techs: ['DEAge0Americans', 'HCAdvancedArsenal']},
  {name: 'Hausa', homecity: 'homecityhausa', techs: ['DEAge0Hausa', 'HCAdvancedArsenal']},
  {name: 'Ethiopians', homecity: 'homecityethiopians', techs: ['DEAge0Ethiopian', 'HCAdvancedArsenal']},
  {name: 'Mexicans', homecity: 'homecitymexicans', techs: ['DEAge0Mexicans', 'HCAdvancedArsenal']},
  {name: 'Italians', homecity: 'homecityitalians', techs: ['DEAge0Italians', 'HCAdvancedArsenal']},
  {name: 'Maltese', homecity: 'homecitymaltese', techs: ['DEAge0Maltese', 'HCAdvancedArsenal']},
  ]
  common_civ_techs = ["VeteranCuirassierShadow", "Colonialize", "Fortressize", "Industrialize", "Imperialize"]

  let sides = ["left", "right"]
  // civ techs available to each side's selected civ
  let civTechsBySide = {}

  // fill each side's column from the panel template; element ids end in Left/Right
  sides.forEach(function(side){
    let panel = document.getElementById("sidePanel").innerHTML
    document.querySelector('.side[data-side="' + side + '"]').innerHTML = panel
      .replaceAll("{Side}", capitalizeFirstLetter(side))
      .replaceAll("{side}", side)
  })

  // add the options to the button
  d3.selectAll(".selectCivButton")
    .selectAll('myOptions')
    .data(civs)
    .enter()
    .append('option')
    .text(function (d) { return d['name']; }) // text showed in the menu
    .attr("value", function (d) { return d['name']; }); // corresponding value returned by the button
  
  let militaryUnits = [];
  let protoy = [];
  let techtree = [];
  let civTechs = [];
  let unit = [];
  
    //Read the data
   d3.xml("./xml/protoy.xml", function(data) {
    data = data.children[0]
    protoy = data;
    units = Array.from(data.children)      
    
  
	
    militaryUnits = units.filter(function(d){
      unittypes = Array.from(d.getElementsByTagName("unittype"))
      unittypes = unittypes.map(d => d.textContent)
      return unittypes.includes("AbstractTownCenter") || (unittypes.includes("Military") && !unittypes.includes("Ship"))
    })
    mercUnits = militaryUnits.filter(function(d){
      unittypes = Array.from(d.getElementsByTagName("unittype"))
      unittypes = unittypes.map(d => d.textContent)
      return unittypes.includes("Mercenary")
    })
    mercUnitNames = Array.from(mercUnits).map(d=>d.attributes["name"].value).sort()
    natUnits = militaryUnits.filter(function(d){
      unittypes = Array.from(d.getElementsByTagName("unittype"))
      unittypes = unittypes.map(d => d.textContent)
      return unittypes.includes("AbstractNativeWarrior")
    })
    natUnitNames = Array.from(natUnits).map(d=>d.attributes["name"].value).sort()
	
	
    consUnits = militaryUnits.filter(function(d){
      unittypes = Array.from(d.getElementsByTagName("unittype"))
      unittypes = unittypes.map(d => d.textContent)
      return unittypes.includes("AbstractConsulateUnit")
    })
    consUnitNames = Array.from(consUnits).map(d=>d.attributes["name"].value).sort()
    dataLoaded()
  })
  let stringdata = {};
      d3.xml("./UI/Data/strings/English/stringtabley.xml", function(data) {
	data=Array.from(data.children[0].children[0].children)
	stringdata= Object.fromEntries( data.map( x => [x.attributes._locid.value, x.textContent]) );
	dataLoaded()

  })
  function getEditorName(selectedUnitName){
  units_ = militaryUnits.filter(d => d.attributes['name'].value == selectedUnitName)
  if (units_.length==0){  return selectedUnitName}
  unit = units_[0]
  stringids_ = unit.getElementsByTagName("editornameid")
    if (stringids_.length==0){  return selectedUnitName}
stringid = stringids_[0].textContent
  return stringdata[stringid]


  }

  
  civs.map(function(civ){
  d3.xml("./xml/"+civ['homecity']+".xml", function(data) {
        data = data.children[0].getElementsByTagName("cards")[0]
        cards = Array.from(data.getElementsByTagName("card"))
        cards = cards.map(d => d.getElementsByTagName("name")[0].textContent)
        civ['cards'] = cards
        dataLoaded()
    })
    return civ
  })
  
  d3.xml("./xml/techtreey.xml", function(data) {
    data = data.children[0]
    techtree = data;
    dataLoaded()
  
  
  
  })
  // Wires one side's civ select, unit search and aura sliders
  function setupSide(side){
    let Side = capitalizeFirstLetter(side)

    d3.select("#selectCivButton" + Side).on("change", function() {
      let selectedCiv = civs.filter(d => d['name'] == this.value)[0]
      savePref("selectCivButton" + Side, selectedCiv['name'])
      civTechsBySide[side] = updateCivTechs(selectedCiv)
      updateUnitButton(selectedCiv, "#selectUnitButton" + Side)
    })

    setupUnitInput("#selectUnitButton" + Side, function(selectedUnit) {
      unit = militaryUnits.filter(d => d.attributes['name'].value == selectedUnit)[0]
      updateUnitStats(unit, [], side)
      updateUnitTechs(unit, civTechsBySide[side], side)
      updateTags(unit, side)
      updateCenter()
    })

    let auraInputIds = ["#auraHitpointsInput" + Side, "#auraAttackInput" + Side]
    auraInputIds.forEach(function(id_){
      d3.select(id_).on("change", function() {
        recalculate(civTechsBySide[side], side)
      })
    })
  }
  sides.forEach(setupSide)

  // xml files still loading: protoy, string table, techtree and one homecity per civ
  let pendingLoads = 3 + civs.length
  function dataLoaded(){
    pendingLoads -= 1
    if (pendingLoads > 0) { return }
    // restore each side's last civ and unit
    sides.forEach(function(side){
      let Side = capitalizeFirstLetter(side)
      let civName = loadPref("selectCivButton" + Side)
      if (!civName || !civs.some(d => d['name'] == civName)) { return }
      let civButton = document.getElementById("selectCivButton" + Side)
      civButton.value = civName
      civButton.dispatchEvent(new Event("change"))
      let unitName = loadPref("selectUnitButton" + Side)
      if (unitName) { selectUnitByName("#selectUnitButton" + Side, unitName) }
    })
  }

function updateCenter(){
    // nothing to compare until both sides have a unit
    if (!unit_tags['left'] || !unit_tags['right']) { return }
    breakpoints_data_lhs = updateBreakpoints('left', 'right')
    breakpoints_data_rhs = updateBreakpoints('right', 'left')
	lancaster()
}

function getUnit(side){
    let selectedUnit = d3.select("#selectUnitButton"+capitalizeFirstLetter(side)).node().dataset.unit
    return militaryUnits.filter(d => d.attributes['name'].value == selectedUnit)[0]
}