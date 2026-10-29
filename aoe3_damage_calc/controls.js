"use strict"

// localStorage can be unavailable (private windows, blocked storage), so failures are ignored
function savePref(key, value){
  try { localStorage.setItem("aoe3calc." + key, value) } catch (e) {}
}
function loadPref(key){
  try { return localStorage.getItem("aoe3calc." + key) } catch (e) { return null }
}

function renderCivOptions(civs){
  d3.selectAll(".selectCivButton")
    .selectAll('option')
    .data(civs)
    .enter()
    .append('option')
    .text(d => d['name'])
    .attr("value", d => d['name'])
}

// Fills a unit search input with the civ's units followed by the mercenary, native and consulate units
function updateUnitOptions(civ, unitButtonID) {
  let groups = [
    {label: "", names: civ.units},
    {label: "Mercenary", names: gameData.unitGroups["Mercenary"]},
    {label: "Native", names: gameData.unitGroups["Native"]},
    {label: "Consulate", names: gameData.unitGroups["Consulate"]},
  ]
  // datalist has no optgroups, so each group is sorted by display name and tagged with a label
  let options = []
  groups.forEach(function(group){
    let groupOptions = group.names.map(d => ({name: d, text: getUnit(d).displayName, group: group.label}))
    groupOptions.sort((a, b) => a.text.localeCompare(b.text))
    options = options.concat(groupOptions)
  })
  // the typed value has to identify one unit, so disambiguate repeated display names
  let counts = {}
  options.forEach(d => counts[d.text] = (counts[d.text] || 0) + 1)
  let unitsByValue = {}
  options.forEach(function(d){
    d.value = d.text
    if (counts[d.text] > 1){
      d.value = d.group ? d.text + " (" + d.group + ")" : d.text
      if (d.value in unitsByValue){ d.value = d.text + " (" + d.name + ")" }
    }
    unitsByValue[d.value] = d.name
  })

  let input = d3.select(unitButtonID)
  let previousUnit = input.node().dataset.unit
  input.property("value", "")
    .attr("placeholder", "Search units...")
  input.node().dataset.unit = ""
  input.node().unitsByValue = unitsByValue

  let datalist = d3.select("#" + input.attr("list"))
  datalist.selectAll('option').remove()
  datalist.selectAll('option')
    .data(options)
    .enter()
    .append('option')
    .attr("value", d => d.value)
    .attr("label", d => d.group)

  // keep the unit selected when the new civ has it too
  if (previousUnit) { selectUnitByName(unitButtonID, previousUnit) }
}

// Selects a unit by internal name if it is in the input's options; returns whether it was found
function selectUnitByName(unitButtonID, unitName){
  let node = d3.select(unitButtonID).node()
  let value = Object.keys(node.unitsByValue || {}).find(k => node.unitsByValue[k] == unitName)
  if (value == undefined) { return false }
  node.value = value
  node.dataset.unit = unitName
  node.dataset.previous = value
  savePref(node.id, unitName)
  node.onUnitSelect(unitName)
  return true
}

// Wires a unit search input; onSelect is called with the internal unit name
function setupUnitInput(unitButtonID, onSelect){
  let input = d3.select(unitButtonID)
  input.node().onUnitSelect = onSelect
  input.on("focus", function(){
    // clear so the datalist shows every unit instead of filtering on the current one
    this.dataset.previous = this.value
    this.value = ""
  })
  input.on("blur", function(){
    if (this.value == "") { this.value = this.dataset.previous || "" }
  })
  input.on("change", function(){
    let selectedUnit = (this.unitsByValue || {})[this.value]
    if (selectedUnit == undefined) { return }
    this.blur()
    selectUnitByName(unitButtonID, selectedUnit)
  })
}

// aura sliders as fractions
function readAuras(side){
  let Side = capitalizeFirstLetter(side)
  return {
    hitpoints: parseFloat(d3.select("#auraHitpointsInput" + Side).property("value"))/100,
    attack: parseFloat(d3.select("#auraAttackInput" + Side).property("value"))/100,
  }
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}
