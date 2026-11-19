import { stanceIconRoot } from "./config.js"

// Names the game shows for attacks. Each stance has its own copy of a unit's hand and ranged attacks
// (DefendHandAttack, VolleyRangedAttack, ...), but the game calls them all "Hand Attack" or "Ranged Attack",
// shortened here to Hand and Ranged; the stance is shown with its command button instead

// stances that prefix attack names, as [prefix, stance]; the stance names its icon in images/stances
const stancePrefixes = [["Defend", "defend"], ["Volley", "volley"], ["Stagger", "stagger"], ["Melee", "melee"], ["Cover", "cover"]]
// attacks named for a stance without saying hand or ranged; ChargeAttack is the melee stance's attack
// on cavalry archers and the like
const stanceAttacks = {
  ChargeAttack: {label: "Hand", stance: "melee"},
  VolleyAttack: {label: "Ranged", stance: "volley"},
  CoverAttack: {label: "Ranged", stance: "cover"},
}
const stanceAttackPattern = new RegExp("^(" + stancePrefixes.map(d => d[0]).join("|") + ")(Hand|Ranged)Attack$")

// {label, stance} for a game attack name, without the word Attack, which every row would have;
// stance is undefined for attacks used in every stance
export function describeAttack(name){
  if (name in stanceAttacks) { return stanceAttacks[name] }
  let match = name.match(stanceAttackPattern)
  if (match){
    return {label: match[2], stance: stancePrefixes.find(d => d[0] == match[1])[1]}
  }
  // BowAttack -> Bow, LassoAttackCharge -> Lasso Charge, "3 vils RangedAttack" -> "3 vils Ranged"
  return {label: name.replace("Attack", "").replace(/([a-z])([A-Z])/g, "$1 $2").trim()}
}

const capitalize = s => s[0].toUpperCase() + s.slice(1)

// Adds label and stances to breakpoint rows, whose attackNames are the game attacks with those breakpoints.
// label joins the rows' attack labels; stances lists the stances they're used in, empty when one is used in all
export function labelAttacks(rows){
  rows.forEach(function(row){
    let attacks = row['attackNames'].map(describeAttack)
    row['label'] = Array.from(new Set(attacks.map(d => d.label))).join(", ")
    row['stances'] = attacks.some(d => !d.stance) ? [] : Array.from(new Set(attacks.map(d => d.stance)))
  })
  return rows
}

// The row's label, or its stances where another row has the same label, e.g. a pikeman's two Hand rows
// are "Defend, Melee" and "Cover"
export function attackLabelText(row, rows){
  let shared = rows.some(other => other != row && other['label'] == row['label'])
  if (!shared || row['stances'].length == 0) { return row['label'] }
  return row['stances'].map(capitalize).join(", ")
}

// The row's label, then an icon for each stance it's used in
export function attackLabelNodes(row){
  let label = document.createElement('span')
  label.className = 'attack-label'
  label.textContent = row['label']
  let stances = document.createElement('span')
  stances.className = 'stances'
  stances.append(...row['stances'].map(function(stance){
    let img = document.createElement('img')
    img.className = 'stance'
    img.src = stanceIconRoot + stance + ".webp"
    img.alt = img.title = capitalize(stance) + " stance"
    return img
  }))
  return [label, stances]
}
