import { gameData, getUnit } from "./data.js"

// localStorage can be unavailable (private windows, blocked storage), so failures are ignored
export function savePref(key, value){
  try { localStorage.setItem("aoe3calc." + key, value) } catch (e) {}
}
export function loadPref(key){
  try { return localStorage.getItem("aoe3calc." + key) } catch (e) { return null }
}

export function renderCivOptions(civs){
  document.querySelectorAll(".selectCivButton").forEach(function(select){
    select.replaceChildren(new Option("Select civ", "", true, true))
    select.options[0].disabled = true
    civs.forEach(civ => select.append(new Option(civ.name, civ.name)))
  })
}

// infantry, then cavalry, then artillery, then everything else
const unitTypeOrder = ["AbstractInfantry", "AbstractCavalry", "AbstractArtillery"]
function unitTypeRank(unit){
  let rank = unitTypeOrder.findIndex(tag => unit.tags.includes(tag))
  return rank == -1 ? unitTypeOrder.length : rank
}

// Fills a unit search input with the civ's units followed by the mercenary, native and consulate units;
// returns whether the unit selected before is still selected
export function updateUnitOptions(civ, input) {
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

  let previousUnit = input.dataset.unit
  input.value = ""
  input.placeholder = "Search units..."
  input.dataset.unit = ""
  input.unitsByValue = unitsByValue
  input.unitOptions = options

  // keep the unit selected when the new civ has it too
  return Boolean(previousUnit) && selectUnitByName(input, previousUnit)
}

// Selects a unit by internal name if it is in the input's options; returns whether it was found
export function selectUnitByName(input, unitName){
  let value = Object.keys(input.unitsByValue || {}).find(k => input.unitsByValue[k] == unitName)
  if (value == undefined) { return false }
  input.value = value
  input.dataset.unit = unitName
  input.dataset.previous = value
  input.onUnitSelect(unitName)
  return true
}

// Shows the unit options matching the typed text under their group labels
function renderUnitList(input){
  let filter = input.value.toLowerCase()
  let shown = (input.unitOptions || []).filter(d => d.value.toLowerCase().includes(filter))
  let items = []
  let lastGroup = ""
  shown.forEach(function(d){
    if (d.group != lastGroup){
      let label = document.createElement("li")
      label.className = "groupLabel"
      label.textContent = d.group
      items.push(label)
      lastGroup = d.group
    }
    let item = document.createElement("li")
    item.className = "unitOption"
    item.textContent = d.text
    item.dataset.unit = d.name
    item.addEventListener("mousedown", function(event){
      // keep focus on the input until the unit is picked
      event.preventDefault()
      pickUnit(input, d.name)
    })
    items.push(item)
  })
  input.unitList.replaceChildren(...items)
  input.highlighted = filter && shown.length ? 0 : -1
  highlightUnitOption(input)
  input.unitList.hidden = false
}

function highlightUnitOption(input){
  let items = input.unitList.querySelectorAll(".unitOption")
  items.forEach((li, i) => li.classList.toggle("highlighted", i == input.highlighted))
  if (input.highlighted >= 0) { items[input.highlighted].scrollIntoView({block: "nearest"}) }
}

function pickUnit(input, unitName){
  input.unitList.hidden = true
  selectUnitByName(input, unitName)
  input.blur()
}

// Wires a unit search input; onSelect is called with the internal unit name
export function setupUnitInput(input, onSelect){
  input.onUnitSelect = onSelect
  input.unitList = input.parentNode.querySelector(".unitList")
  input.addEventListener("focus", function(){
    // clear so the list shows every unit instead of filtering on the current one
    this.dataset.previous = this.value
    this.value = ""
    renderUnitList(this)
  })
  input.addEventListener("input", function(){ renderUnitList(this) })
  input.addEventListener("blur", function(){
    this.unitList.hidden = true
    if (this.value == "") { this.value = this.dataset.previous || "" }
  })
  input.addEventListener("keydown", function(event){
    let items = this.unitList.querySelectorAll(".unitOption")
    if (event.key == "ArrowDown" || event.key == "ArrowUp"){
      event.preventDefault()
      let step = event.key == "ArrowDown" ? 1 : -1
      this.highlighted = Math.max(0, Math.min(items.length - 1, this.highlighted + step))
      highlightUnitOption(this)
    } else if (event.key == "Enter" && this.highlighted >= 0){
      pickUnit(this, items[this.highlighted].dataset.unit)
    } else if (event.key == "Escape"){
      this.value = ""
      this.blur()
    }
  })
}

// Wires an aura slider and its % label; onChange is called with the value as a fraction while dragging
export function setupAuraInput(input, label, onChange){
  input.addEventListener("input", function(){
    label.textContent = input.value
    onChange(parseFloat(input.value) / 100)
  })
}

// Moves an aura slider to a fraction without firing its events
export function setAuraInput(input, label, fraction){
  input.value = Math.round(fraction * 100)
  label.textContent = input.value
}

export function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}
