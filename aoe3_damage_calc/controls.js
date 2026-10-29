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

// Fills a unit search input with the civ's units followed by the mercenary, native and consulate units;
// returns whether the unit selected before is still selected
export function updateUnitOptions(civ, input) {
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

  let previousUnit = input.dataset.unit
  input.value = ""
  input.placeholder = "Search units..."
  input.dataset.unit = ""
  input.unitsByValue = unitsByValue

  input.list.replaceChildren(...options.map(function(d){
    let option = document.createElement("option")
    option.value = d.value
    option.label = d.group
    return option
  }))

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

// Wires a unit search input; onSelect is called with the internal unit name
export function setupUnitInput(input, onSelect){
  input.onUnitSelect = onSelect
  input.addEventListener("focus", function(){
    // clear so the datalist shows every unit instead of filtering on the current one
    this.dataset.previous = this.value
    this.value = ""
  })
  input.addEventListener("blur", function(){
    if (this.value == "") { this.value = this.dataset.previous || "" }
  })
  input.addEventListener("change", function(){
    let selectedUnit = (this.unitsByValue || {})[this.value]
    if (selectedUnit == undefined) { return }
    this.blur()
    selectUnitByName(input, selectedUnit)
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
