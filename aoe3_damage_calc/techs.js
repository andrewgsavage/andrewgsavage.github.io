"use strict"

// Techs with an effect that targets the unit, in techtree order
function gatherUnitTechs(unit){
  let tags = unitTargetTags(unit)
  return gameData.techs.filter(tech => tech.effects.some(effect => effect.targets.some(target => tags.includes(target))))
}

// Splits a unit's techs into the card groups shown above its stats: research, home city, team and native techs
function groupUnitTechs(relevantTechs, civTechs){
  let hasFlag = (tech, flag) => tech.flags.includes(flag)
  let researchTechs = relevantTechs.filter(d => civTechs.includes(d.name) &&
      (hasFlag(d, "UpgradeTech")
      || ["PaperCartridge", "Age0Russian"].includes(d.name)
      || hasFlag(d, "Shadow") && !d.name.includes("Wonder"))
      )
  let hcTechs = relevantTechs.filter(d => civTechs.includes(d.name) &&
      ( hasFlag(d, "HomeCity") || hasFlag(d, "YPConsulateTech") ))
  let teamTechs = relevantTechs.filter(d => !hcTechs.includes(d) &&
      hasFlag(d, "HomeCity") &&
      hasFlag(d, "TeamTech") )
  let nativeTechs = relevantTechs.filter(d => hasFlag(d, "YPNativeImprovement") )
  return [researchTechs, hcTechs, teamTechs, nativeTechs]
}
