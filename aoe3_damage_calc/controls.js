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

// infantry, then cavalry, then artillery, then everything else
const unitTypeOrder = ["AbstractInfantry", "AbstractCavalry", "AbstractArtillery"]
function unitTypeRank(unit){
  let rank = unitTypeOrder.findIndex(tag => unit.tags.includes(tag))
  return rank == -1 ? unitTypeOrder.length : rank
}

// Fills a unit search input with the civ's units followed by the mercenary, native and consulate units
function updateUnitOptions(civ, unitButtonID) {
  let groups = [
    {label: "", names: civ.units},
    {label: "Mercenary", names: gameData.unitGroups["Mercenary"]},
    {label: "Native", names: gameData.unitGroups["Native"]},
    {label: "Consulate", names: gameData.unitGroups["Consulate"]},
  ]
  // each group is sorted by unit type, then display name
  let options = []
  groups.forEach(function(group){
    let groupOptions = group.names.map(function(d){
      let unit = getUnit(d)
      return {name: d, text: unit.displayName, group: group.label, rank: unitTypeRank(unit)}
    })
    groupOptions.sort((a, b) => a.rank - b.rank || a.text.localeCompare(b.text))
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
  input.node().unitOptions = options

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

// Shows the unit options matching the typed text under their group labels
function renderUnitList(node){
  let filter = node.value.toLowerCase()
  let shown = (node.unitOptions || []).filter(d => d.value.toLowerCase().includes(filter))
  let list = d3.select(node.unitList)
  list.selectAll("li").remove()
  let lastGroup = ""
  shown.forEach(function(d){
    if (d.group != lastGroup){
      list.append("li").attr("class", "groupLabel").text(d.group)
      lastGroup = d.group
    }
    list.append("li").attr("class", "unitOption").datum(d).text(d.text)
  })
  list.selectAll(".unitOption").on("mousedown", function(d){
    // keep focus on the input until the unit is picked
    d3.event.preventDefault()
    pickUnit(node, d.name)
  })
  node.highlighted = filter && shown.length ? 0 : -1
  highlightUnitOption(node)
  node.unitList.hidden = false
}

function highlightUnitOption(node){
  let items = node.unitList.querySelectorAll(".unitOption")
  items.forEach((li, i) => li.classList.toggle("highlighted", i == node.highlighted))
  if (node.highlighted >= 0) { items[node.highlighted].scrollIntoView({block: "nearest"}) }
}

function pickUnit(node, unitName){
  node.unitList.hidden = true
  selectUnitByName("#" + node.id, unitName)
  node.blur()
}

// Wires a unit search input; onSelect is called with the internal unit name
function setupUnitInput(unitButtonID, onSelect){
  let input = d3.select(unitButtonID)
  let node = input.node()
  node.onUnitSelect = onSelect
  node.unitList = node.parentNode.querySelector(".unitList")
  input.on("focus", function(){
    // clear so the list shows every unit instead of filtering on the current one
    this.dataset.previous = this.value
    this.value = ""
    renderUnitList(this)
  })
  input.on("input", function(){ renderUnitList(this) })
  input.on("blur", function(){
    this.unitList.hidden = true
    if (this.value == "") { this.value = this.dataset.previous || "" }
  })
  input.on("keydown", function(){
    let count = this.unitList.querySelectorAll(".unitOption").length
    let key = d3.event.key
    if (key == "ArrowDown" || key == "ArrowUp"){
      d3.event.preventDefault()
      let step = key == "ArrowDown" ? 1 : -1
      this.highlighted = Math.max(0, Math.min(count - 1, this.highlighted + step))
      highlightUnitOption(this)
    } else if (key == "Enter" && this.highlighted >= 0){
      let d = d3.select(this.unitList.querySelectorAll(".unitOption")[this.highlighted]).datum()
      pickUnit(this, d.name)
    } else if (key == "Escape"){
      this.value = ""
      this.blur()
    }
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
