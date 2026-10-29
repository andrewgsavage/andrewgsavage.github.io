"use strict"

// attacks left out of the damage tables
const hiddenAttackNames = ['BuildingAttack', 'CoverBuildingAttack', 'RangedDefendBuildingAttack', 'DefendBuildingAttack', 'ChopAttack', 'HandAttackCrate', 'RangedBuildingAttack', 'LanceHandAttack', 'GuardianAttack', 'MortarBuildingAttack', 'TrampleHandAttack']

// stats shown at the top of the stats table; gameName is the protoy tag, subtype the tech effect subtype that modifies it
const textStats = [
  {gameName:'populationcount', niceName: 'Population'},
  {gameName:'maxvelocity', niceName: 'Speed', subtype: 'MaximumVelocity'},
  {gameName:'maxrunvelocity', niceName: 'Max Speed'},
  {gameName:'turnrate', niceName: 'Turn Rate'},
  {gameName:'maxhitpoints', niceName: 'Hitpoints', subtype: 'Hitpoints'},
  {gameName:'los', niceName: 'Line of Sight', subtype: 'LOS'},
  {gameName:'trainpoints', niceName: 'Train Points', subtype: 'TrainPoints'},
  {gameName:'bounty', niceName: 'XP Bounty'},
]

const armorTypes = ["Hand", "Ranged", "Siege"]
const costTypes = ["Food", "Wood", "Gold"]
// villager gather rates, used to convert costs into villager seconds
const gatherRates = {Food: 0.84, Wood: 0.5, Gold: 0.6}

// unittypes left out of the tags table, which is also what damage bonuses are matched against
const hiddenTags = ["UnitClass", "Military", "Unit", "ConvertsHerds", "HasBountyValue", "CountsTowardMilitaryScore"]

const iconRoot = "/aoe3_damage_calc/UI/Data/wpfg/"
