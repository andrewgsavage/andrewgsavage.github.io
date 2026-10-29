
  function getAllEffects(tech_list){
    effects = tech_list.map(function(age0CivName){
      age0Civ = Array.from(techtree.children).filter(d => d.attributes["name"].value == age0CivName)[0]
      effects =Array.from(age0Civ.getElementsByTagName("effect"))
      return effects
    })
	effects = [].concat(...effects)
	effects = effects.filter(d => d != undefined)
    return effects
  }
  
  function updateCivTechs(selectedCiv){
    effects = getAllEffects(selectedCiv['techs'])
    civTechs = effects.filter(d => d.attributes['type'].value=="TechStatus").map(d => d.textContent).concat(selectedCiv['techs'])
    civTechs = civTechs.concat(selectedCiv['cards']).concat(common_civ_techs)
    return civTechs
  }
  
  
  function gatherUnitTechs(unit, civTechs){
    tags = Array.from(unit.getElementsByTagName("unittype")).map(d => d.textContent)
    tags.push(unit.attributes['name'].value)
  
    relevant_techs = Array.from(techtree.children).filter(function(tech){
      effects_parent = tech.getElementsByTagName("effects")
      if (effects_parent.length == 0){
        return false
      }
      effects = Array.from(tech.getElementsByTagName("effects")[0].children).filter(function(effect){
		  if(effect.attributes['subtype'] =="Enable"){
			  return false
		  }
        targets = Array.from(effect.getElementsByTagName("target")).filter(function(target){
          return tags.includes(target.textContent);
        });
        return targets.length>0
      })
      return effects.length>0
    })
    return relevant_techs
  }
  function groupUnitTechs(relevant_techs, civTechs){
    function hasElementWithTextContent(parent, element, textContent){
      tags = Array.from(parent.getElementsByTagName(element)).filter(d => d.textContent == textContent)
      return tags.length>0
    }  
    research_techs = relevant_techs.filter(d => civTechs.includes(d.attributes['name'].value) && 
        (hasElementWithTextContent(d, "flag", "UpgradeTech")
        || ["PaperCartridge", "Age0Russian"].includes(d.attributes['name'].value) 
        || hasElementWithTextContent(d, "flag", "Shadow") && !d.attributes['name'].value.includes("Wonder"))
        )
    hc_techs = relevant_techs.filter(d => civTechs.includes(d.attributes['name'].value) && 
        ( hasElementWithTextContent(d, "flag", "HomeCity") || hasElementWithTextContent(d, "flag", "YPConsulateTech") ))
    team_techs = relevant_techs.filter(d => !hc_techs.includes(d) && 
        hasElementWithTextContent(d, "flag", "HomeCity")  && 
        hasElementWithTextContent(d, "flag", "TeamTech") )
    native_techs = relevant_techs.filter(d => hasElementWithTextContent(d, "flag", "YPNativeImprovement") )
    return [research_techs, hc_techs, team_techs, native_techs]
  }
  
  function recalculate(civTechs,side){
	  unit = getUnit(side)
	  
	relevant_techs = gatherUnitTechs(unit, civTechs)
	active_techs = Array.from(d3.selectAll('.card.active.'+side)._groups[0]).map(d =>  d.children[0].attributes['title'].value)
	active_techs = relevant_techs.filter(d => active_techs.includes(d.attributes['name'].value))
	updateUnitStats(unit, active_techs, side)
	updateCenter()

  }
  
  function updateUnitTechs(unit, civTechs, side){
    relevant_techs = gatherUnitTechs(unit, civTechs)
    tech_groups = groupUnitTechs(relevant_techs, civTechs)
    let gallery = d3.select('.cards.'+side).html("")
  
    tech_groups.forEach(function(techs){
      let techs_container = gallery.append("div")
        .attr('class', 'card_group')
  
      let container = techs_container.selectAll('.container')
  
      container.enter().append('div')
        .data(techs, function(d) {return d.id; })
        .enter().append('div')
        .attr('class', 'card '+side)
        .on("click", function(d) {
            this.classList.toggle("active")
			recalculate(civTechs,side)
        })
        .append('img')
        .attr("title", function(d){return d.attributes['name'].value})
        .attr('src', function(d) { 
          icon_list = d.getElementsByTagName("icon")
          if (icon_list.length == 0){
            return ""
          }
          link = "/aoe3_damage_calc/UI/Data/wpfg/" + icon_list[0].textContent.toLowerCase()
      return link; });
    })
  }
  
  function updateTags(unit, side){
    tags = Array.from(unit.getElementsByTagName("unittype")).map(d => d.textContent)
    tags = tags.filter(function(tag){
      if (tag.includes("LogicalType")){
        return false
      }
      if (["UnitClass", "Military", "Unit", "ConvertsHerds", "HasBountyValue", "CountsTowardMilitaryScore"
    ].includes(tag)){
        return false
      }
      return true
    })
    tags = tags.map(function(d){ return {"tag" : d} })
    tags.push({'tag': unit.attributes['name'].value})
    unit_tags[side] = tags
  
    let columns = [
        { head: 'tag', cl: 'title', html: d => d['tag'] },
  ]
    renderTable('.tags.'+side, columns, tags)
  }

  function getUnitName(side){
    return unit_tags[side].map( d => d['tag']).slice(-1)[0]
  }
  
    function updateUnitButton(selectedCiv, unitButtonID) {
      effects = getAllEffects(selectedCiv['techs'])
      civUnits = effects.filter(d => d.attributes['type'].value=="Data" ).map(d => d.children[0].textContent)
  
      militaryUnitNames = Array.from(militaryUnits).map(d=>d.attributes["name"].value)
      civMilUnits = Array.from(new Set(civUnits.filter(d => militaryUnitNames.includes(d))))
      let groups = [
        {label: "", names: civMilUnits},
        {label: "Mercenary", names: mercUnitNames},
        {label: "Native", names: natUnitNames},
        {label: "Consulate", names: consUnitNames},
      ]
      // datalist has no optgroups, so each group is sorted by display name and tagged with a label
      let options = []
      groups.forEach(function(group){
        let groupOptions = group.names.map(d => ({name: d, text: getEditorName(d) || d, group: group.label}))
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

    // localStorage can be unavailable (private windows, blocked storage), so failures are ignored
    function savePref(key, value){
      try { localStorage.setItem("aoe3calc." + key, value) } catch (e) {}
    }
    function loadPref(key){
      try { return localStorage.getItem("aoe3calc." + key) } catch (e) { return null }
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
  