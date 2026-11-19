import { patches, loadPatchList, loadPatch, getPatchInfo, getUnit, getCiv, unitDisplayTags } from "./data.js"
import { gatherUnitTechs, groupUnitTechs, isAge0Tech } from "./techs.js"
import { calcUnitStats, getStat } from "./stats.js"
import { calcBreakpoints, reduceBreakpoints, calcLancaster } from "./combat.js"
import { renderStats, renderTags, renderCards, renderBreakpoints, renderLancaster, renderMatchup } from "./render.js"
import { savePref, loadPref, renderPatchOptions, renderCivOptions, updateUnitOptions, selectUnitByName, setupUnitInput,
  setupAuraInput, setAuraInput, capitalizeFirstLetter } from "./controls.js"

const sides = ["left", "right"]
const auraNames = ["hitpoints", "attack"]

// per side: patch (the game data the side uses), civ, unit, techs (techs that affect the unit),
// activeCards (names of the techs switched on), auras ({hitpoints, attack} as fractions), stats and tags
const state = {}
sides.forEach(function(side){
  state[side] = {patch: null, civ: null, unit: null, techs: [], activeCards: new Set(), auras: {hitpoints: 0, attack: 0}, stats: null, tags: []}
})

// fill each side's column from the panel template; element ids end in Left/Right
sides.forEach(function(side){
  let panel = document.getElementById("sidePanel").innerHTML
  document.querySelector('.side[data-side="' + side + '"]').innerHTML = panel
    .replaceAll("{Side}", capitalizeFirstLetter(side))
    .replaceAll("{side}", side)
})

function element(id, side){
  return document.getElementById(id + capitalizeFirstLetter(side))
}

function auraElements(side, aura){
  let name = "aura" + capitalizeFirstLetter(aura)
  return [element(name + "Input", side), element(name + "Value", side)]
}

function clearUnit(side){
  Object.assign(state[side], {unit: null, techs: [], activeCards: new Set(), stats: null, tags: []})
  document.querySelectorAll('.' + side + ':is(.cards, .stats, .tags), .breakpoints, .lancaster, .matchup').forEach(d => d.replaceChildren())
}

// Switches a side to another patch's data, then restores its civ, unit, cards and auras from params
// where the patch still has them
function selectPatch(side, patch, params){
  let s = state[side]
  s.patch = patch
  s.civ = null
  clearUnit(side)
  let unitInput = element("selectUnitButton", side)
  Object.assign(unitInput, {value: "", placeholder: "Select civ first", unitsByValue: {}, unitOptions: []})
  unitInput.dataset.unit = ""
  renderCivOptions(element("selectCivButton", side), patch.civs)
  restoreCivAndUnit(side, params)
  updateLink()
}

function selectCiv(side, civ){
  let s = state[side]
  s.civ = civ
  // the unit is reselected if the new civ has it too, otherwise the side is emptied
  if (!updateUnitOptions(s.patch, civ, element("selectUnitButton", side)) && s.unit){
    clearUnit(side)
  }
  updateLink()
}

// activeCards: names of the cards to start switched on; by default the ones already on when the unit is
// unchanged, otherwise the civ's starting techs
function selectUnit(side, unit, activeCards){
  let s = state[side]
  let sameUnit = unit == s.unit
  s.unit = unit
  s.tags = unitDisplayTags(unit)
  s.techs = gatherUnitTechs(s.patch, unit)
  let techGroups = groupUnitTechs(s.techs, s.civ.techs)
  if (activeCards == undefined){
    activeCards = sameUnit ? Array.from(s.activeCards) : techGroups.flat().filter(isAge0Tech).map(d => d.name)
  }
  // only cards the civ shows can be on
  let shown = new Set(techGroups.flat().map(d => d.name))
  s.activeCards = new Set(activeCards.filter(name => shown.has(name)))
  renderCards(side, techGroups, name => s.activeCards.has(name), function(name, active){
    if (active) { s.activeCards.add(name) } else { s.activeCards.delete(name) }
    recalculate(side)
  })
  renderTags(side, s.tags)
  recalculate(side)
}

// Recomputes a side's stats from its active cards and auras, then the comparison tables
function recalculate(side){
  let s = state[side]
  if (s.unit){
    s.stats = calcUnitStats(s.patch, s.unit, s.techs.filter(d => s.activeCards.has(d.name)), s.auras)
    renderStats(side, s.stats)
    updateCenter()
  }
  updateLink()
}

function updateCenter(){
  let left = state.left, right = state.right
  // nothing to compare until both sides have a unit
  if (!left.stats || !right.stats) { return }
  let leftBreakpoints = reduceBreakpoints(calcBreakpoints(left, right))
  let rightBreakpoints = reduceBreakpoints(calcBreakpoints(right, left))
  renderBreakpoints('left', left.unit.name + " (left) attacking " + right.unit.name + " (right)", leftBreakpoints)
  renderBreakpoints('right', right.unit.name + " (right) attacking " + left.unit.name + " (left)", rightBreakpoints)
  let lancaster = calcLancaster(leftBreakpoints, rightBreakpoints, getStat(left.stats, 'TotalCost'), getStat(right.stats, 'TotalCost'))
  renderLancaster(lancaster, rightBreakpoints)
  renderMatchup(left.unit, right.unit)
}

// The page's setup lives in the URL hash so it can be shared, e.g.
// #leftPatch=2026-10&leftCiv=British&leftUnit=Musketeer&leftCards=RGRedcoats&leftAuras=10,0&rightPatch=...
// and is also saved so the next visit starts where this one left off
function linkParams(){
  let params = new URLSearchParams()
  sides.forEach(function(side){
    let s = state[side]
    if (s.patch) { params.set(side + "Patch", s.patch.name) }
    if (s.civ) { params.set(side + "Civ", s.civ.name) }
    if (s.unit) { params.set(side + "Unit", s.unit.name) }
    if (s.activeCards.size) { params.set(side + "Cards", Array.from(s.activeCards).join(",")) }
    if (auraNames.some(aura => s.auras[aura])) {
      params.set(side + "Auras", auraNames.map(aura => Math.round(s.auras[aura] * 100)).join(","))
    }
  })
  return params
}

function updateLink(){
  let hash = linkParams().toString()
  history.replaceState(null, "", hash ? "#" + hash : location.pathname + location.search)
  savePref("link", hash)
}

// Loads the side's patch from params, or the newest one if params has none or one that no longer exists,
// then restores the rest of the side
function restoreSide(side, params){
  let info = getPatchInfo(params.get(side + "Patch")) || patches[0]
  element("selectPatchButton", side).value = info.name
  state[side].pendingPatch = info.name
  return loadPatch(info.name).then(function(patch){
    // a patch picked while this one was loading wins
    if (state[side].pendingPatch == patch.name) { selectPatch(side, patch, params) }
  })
}

function restoreCivAndUnit(side, params){
  let s = state[side]
  let civ = getCiv(s.patch, params.get(side + "Civ"))
  if (!civ) { return }
  element("selectCivButton", side).value = civ.name
  selectCiv(side, civ)
  let auras = (params.get(side + "Auras") || "").split(",")
  auraNames.forEach(function(aura, i){
    let fraction = (parseFloat(auras[i]) || 0) / 100
    s.auras[aura] = fraction
    setAuraInput(...auraElements(side, aura), fraction)
  })
  let unitName = params.get(side + "Unit")
  // selecting the unit resets its cards, so set the saved ones after; a link without cards has them all off
  if (unitName && selectUnitByName(element("selectUnitButton", side), unitName)){
    let cards = (params.get(side + "Cards") || "").split(",").filter(d => d)
    selectUnit(side, getUnit(s.patch, unitName), cards)
  }
}

// Wires one side's patch and civ selects, unit search and aura sliders
function setupSide(side){
  let patchSelect = element("selectPatchButton", side)
  renderPatchOptions(patchSelect, patches)
  // the side keeps its civ, unit, cards and auras where the new patch still has them
  patchSelect.addEventListener("change", function() {
    let params = linkParams()
    params.set(side + "Patch", this.value)
    restoreSide(side, params)
  })

  element("selectCivButton", side).addEventListener("change", function() {
    selectCiv(side, getCiv(state[side].patch, this.value))
  })

  setupUnitInput(element("selectUnitButton", side), name => selectUnit(side, getUnit(state[side].patch, name)))

  auraNames.forEach(function(aura){
    setupAuraInput(...auraElements(side, aura), function(fraction){
      state[side].auras[aura] = fraction
      recalculate(side)
    })
  })
}

document.getElementById("copyLink").addEventListener("click", function(){
  let button = this
  navigator.clipboard.writeText(location.href).then(function(){
    button.textContent = "Link copied"
    setTimeout(() => button.textContent = "Copy link", 1500)
  })
})

// the simplified view is the default; choosing the full one is remembered for the next visit
const simpleView = document.getElementById("simpleView")
function setSimpleView(simple){
  simpleView.checked = simple
  document.body.classList.toggle("simple", simple)
}
setSimpleView(loadPref("simpleView") != "0")
simpleView.addEventListener("change", function(){
  setSimpleView(this.checked)
  savePref("simpleView", this.checked ? "1" : "0")
})

// a link pasted into the address bar of an open page
window.addEventListener("hashchange", () => location.reload())

loadPatchList().then(function(){
  sides.forEach(setupSide)
  let params = new URLSearchParams(location.hash.slice(1))
  if (!location.hash){
    // a return visit picks up where it left off, but on the newest patch
    params = new URLSearchParams(loadPref("link") || "")
    sides.forEach(side => params.delete(side + "Patch"))
  }
  sides.forEach(side => restoreSide(side, params))
})
