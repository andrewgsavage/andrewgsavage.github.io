
  function getAllEffects(tech_list){
    effects = tech_list.map(function(age0CivName){
      age0Civ = Array.from(techtree.children).filter(d => d.attributes["name"].value == age0CivName)[0]
      effects =Array.from(age0Civ.getElementsByTagName("effect"))
      return effects
    })
	effects = [].concat(...effects)
	effects = effects.filter(d => d != undefined)
	console.log(effects)
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
			  console.log(effect.attributes['subtype'])
			  return false
		  }
        targets = Array.from(effect.getElementsByTagName("target")).filter(function(target){
          return tags.includes(target.textContent);
        });
        return targets.length>0
      })
      return effects.length>0
    })
	 console.log(relevant_techs.map(d=>d.attributes['name'].textContent))
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
	console.log(relevant_techs.map(d=>d.attributes['name'].textContent))
	active_techs = Array.from(d3.selectAll('.card.active.'+side)._groups[0]).map(d =>  d.children[0].attributes['title'].value)
	active_techs = relevant_techs.filter(d => active_techs.includes(d.attributes['name'].value))
	console.log(relevant_techs, active_techs)
	updateUnitStats(unit, active_techs, side)
	updateCenter()

  }
  
  function updateUnitTechs(unit, civTechs, side){
    relevant_techs = gatherUnitTechs(unit, civTechs)
    console.log(relevant_techs.map(d=>d.attributes['name'].textContent))
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
    let table = d3.select('.tags.'+side).html("")
  
    // create table header
    table.append('thead').append('tr')
        .selectAll('th')
        .data(["tag"]).enter()
        .append('th')
        .text(d => d);
  
    // create table body
    table.append('tbody')
        .selectAll('tr')
        .data(tags).enter()
        .append('tr')
        .selectAll('td')
        .data(function(row, i) {
            return columns.map(function(c) {
                // compute cell values for this specific row
                let cell = {};
                d3.keys(c).forEach(function(k) {
                    cell[k] = typeof c[k] == 'function' ? c[k](row,i) : c[k];
                });
                return cell;
            });
        }).enter()
        .append('td')
        .text(d => d['head'])
        .html(d => d['html'])
        .attr('class', d => d['cl'])
  }

                function getUnitName(side){
        return unit_tags[side].map( d => d['tag']).slice(-1)[0]
        }
  
    function updateUnitButton(selectedCiv, unitButtonID) {
      effects = getAllEffects(selectedCiv['techs'])
      civUnits = effects.filter(d => d.attributes['type'].value=="Data" ).map(d => d.children[0].textContent)
  
      militaryUnitNames = Array.from(militaryUnits).map(d=>d.attributes["name"].value)
      civMilUnits = new Set(civUnits.filter(d => militaryUnitNames.includes(d)));
      civMilUnits = ["Select Unit"].concat(Array.from(civMilUnits).sort() )
      civMilUnits = civMilUnits.concat(mercUnitNames).concat(natUnitNames).concat(consUnitNames)
      // add remove old options from the button
      d3.select(unitButtonID)
        .selectAll('option')
        .data([])
        .exit().remove();
  
      // add the options to the button
      d3.select(unitButtonID)
        .selectAll('option')
        .data(civMilUnits)
        .enter()
        .append('option')
        .text(function (d) {return getEditorName(d); }) // text showed in the menu
        .attr("value", function (d) { return d; }) // corresponding value returned by the button
    }
  