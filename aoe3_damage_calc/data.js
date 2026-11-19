import { hiddenTags } from "./config.js"

// Game data written by tools/extract_data.py, one folder per game patch under data/;
// data/patches.json lists them newest first as {name, label}
export let patches = []
const loadedPatches = {}

export function loadPatchList(){
  return fetch("data/patches.json").then(r => r.json()).then(list => patches = list)
}

export function getPatchInfo(name){
  return patches.find(d => d.name == name)
}

// Resolves to the patch's data, fetched once:
// {name, label,
//  units: selectable units {name, displayName, tags, stats, armor, costs, attacks},
//  unitGroups: unit names offered to every civ, by group label,
//  techs: techs that affect a unit {name, displayName, description, flags, icon, effects, statusTechs},
//  civs: {name, techs, units}}
export function loadPatch(name){
  if (!(name in loadedPatches)){
    let dir = "data/" + name + "/"
    let files = ["units", "techs", "civs"].map(file => fetch(dir + file + ".json").then(r => r.json()))
    loadedPatches[name] = Promise.all(files).then(function([units, techs, civs]){
      let patch = {...getPatchInfo(name), units: units.units, unitGroups: units.groups, techs: techs, civs: civs,
        unitsByName: {}, techsByName: {}}
      // card icons and unit portraits are shared by every patch
      patch.units.forEach(function(u){
        if (u.icon != null) { u.icon = "data/icons/" + u.icon }
        if (!(u.name in patch.unitsByName)) { patch.unitsByName[u.name] = u }
      })
      patch.techs.forEach(function(t){
        if (t.icon != null) { t.icon = "data/icons/" + t.icon }
        if (!(t.name in patch.techsByName)) { patch.techsByName[t.name] = t }
      })
      return patch
    })
  }
  return loadedPatches[name]
}

export function getUnit(patch, name){
  return patch.unitsByName[name]
}

export function getTech(patch, name){
  return patch.techsByName[name]
}

export function getCiv(patch, name){
  return patch.civs.find(d => d.name == name)
}

// unittypes plus the unit's own name, which is what tech effects target
export function unitTargetTags(unit){
  return unit.tags.concat([unit.name])
}

// tags shown in the tags table and matched by damage bonuses
export function unitDisplayTags(unit){
  let tags = unit.tags.filter(tag => !tag.includes("LogicalType") && !hiddenTags.includes(tag))
  return tags.concat([unit.name])
}
