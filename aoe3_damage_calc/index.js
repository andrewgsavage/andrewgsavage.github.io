let civs = [
  {name: 'French', age0Civ: 'Age0French', homecity: 'homecityfrench', techs: ['Age0French', 'AAStandardStartingTechs', 'HCAdvancedArsenal', 'DEGrenadierEnable'] },
  {name: 'Russian', age0Civ: 'Age0Russian', homecity: 'homecityrussians', techs: ['Age0Russian', 'AAStandardStartingTechs', 'HCAdvancedArsenal', 'DEGrenadierEnable']},
  {name: 'British', age0Civ: 'Age0British', homecity: 'homecitybritish', techs: ['Age0British', 'AAStandardStartingTechs', 'HCAdvancedArsenal', 'DEGrenadierEnable']},
  {name: 'Dutch', age0Civ: 'Age0Dutch', homecity: 'homecitydutch', techs: ['Age0Dutch', 'AAStandardStartingTechs', 'HCAdvancedArsenal', 'DEGrenadierEnable']},
  {name: 'German', age0Civ: 'Age0German', homecity: 'homecitygerman', techs: ['Age0German', 'AAStandardStartingTechs', 'HCAdvancedArsenal', 'DEGrenadierEnable']},
  {name: 'Portuguese', age0Civ: 'Age0Portuguese', homecity: 'homecityportuguese', techs: ['Age0Portuguese', 'AAStandardStartingTechs', 'HCAdvancedArsenal', 'DEGrenadierEnable']},
  {name: 'Ottoman', age0Civ: 'Age0Ottoman', homecity: 'homecityottomans', techs: ['Age0Ottoman', 'AAStandardStartingTechs', 'HCAdvancedArsenal', 'DEVeteranNizam', 'DEGrenadierEnable']},
  {name: 'Spanish', techtree: 'Age0Spanish', homecity: 'homecityspanish', techs: ['Age0Spanish', 'AAStandardStartingTechs', 'HCAdvancedArsenal', 'DEGrenadierEnable']},
  {name: 'Iroquois', techtree: 'Age0XPIroquois', homecity: 'homecityxpiroquois', techs: ['Age0XPIroquois', 'HCXPNewWaysIroquois', ]},
  {name: 'Aztec', techtree: 'Age0XPAztec', homecity: 'homecityxpaztec', techs: ['Age0XPAztec', ]},
  {name: 'Sioux', techtree: 'Age0XPSioux', homecity: 'homecityxpsioux', techs: ['Age0XPSioux', 'HCXPNewWaysSioux', ]},
  {name: 'Japanese', techtree: 'YPAge0Japanese', homecity: 'homecityjapanese', techs: ["YPAge0JapaneseConsulate", "YPAge0JapaneseBuildings", "YPAge0JapaneseUnits", "YPAge0JapaneseMonks", "YPAge0JapaneseTechs", "YPAge0JapaneseWonders", "YPAge0JapaneseSpecialTechs", ]},
  {name: 'Chinese', techtree: 'YPAge0Chinese', homecity: 'homecitychinese', techs: ["YPAge0ChineseConsulate", "YPAge0ChineseBuildings", "YPAge0ChineseUnits", "YPAge0ChineseMonks", "YPAge0ChineseTechs", "YPAge0ChineseWonders", "YPAge0ChineseSpecialTechs", "YPAge0ChineseClone6"]},
  {name: 'Indians', techtree: 'YPAge0Indians', homecity: 'homecityindians', techs: ["ypAge0IndiansConsulate", "ypAge0IndiansBuildings", "ypAge0IndiansUnits", "ypAge0IndiansMonks", "ypAge0IndiansTechs", "ypAge0IndiansWonders", "ypAge0IndiansSpecialTechs", ]},
  {name: 'Inca', techtree: 'DEAge0Inca', homecity: 'homecitydeinca', techs: ['DEAge0Inca', ]},
  {name: 'Swedish', techtree: 'DEAge0Swedish', homecity: 'homecityswedish', techs: ['DEAge0Swedish', 'DEGrenadierEnable']},
  ]
  
  // add the options to the button
  d3.selectAll(".selectCivButton")
    .selectAll('myOptions')
    .data(civs)
    .enter()
    .append('option')
    .text(function (d) { return d['name']; }) // text showed in the menu
    .attr("value", function (d) { return d['name']; }); // corresponding value returned by the button
  
  let militaryUnits = [];
  let protoy = [];
  let techtree = [];
  let civTechs = [];
  let unit = [];
  
    //Read the data
  // d3.xml("./xml/protoy.xml", function(data) {
  d3.xml("https://raw.githubusercontent.com/andrewgsavage/andrewgsavage.github.io/master/aoe3_damage_calc/xml/protoy.xml", function(data) {
    data = data.children[0]
    protoy = data;
    units = Array.from(data.children)      
    militaryUnits = units.filter(function(d){
      unittypes = Array.from(d.getElementsByTagName("unittype"))
      unittypes = unittypes.map(d => d.textContent)
      return unittypes.includes("Military")
    })
  })
  
  civs.map(function(civ){    
      d3.xml("./xml/"+civ['homecity']+".xml", function(data) {
        data = data.children[0].getElementsByTagName("cards")[0]
        cards = Array.from(data.getElementsByTagName("card"))
        cards = cards.map(d => d.getElementsByTagName("name")[0].textContent)
        civ['cards'] = cards
    })
    return civ
  })
  
  d3.xml("./xml/techtreey.xml", function(data) {
    data = data.children[0]
    techtree = data;
  
    function updateUnitButton(selectedCiv, unitButtonID) {
      effects = getAllEffects(selectedCiv['techs'])
      civUnits = effects.filter(d => d.attributes['type'].value=="Data" ).map(d => d.children[0].textContent)
  
      militaryUnitNames = Array.from(militaryUnits).map(d=>d.attributes["name"].value)
      civMilUnits = new Set(civUnits.filter(d => militaryUnitNames.includes(d)));
      civMilUnits = Array.from(civMilUnits)
  
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
        .text(function (d) { return d; }) // text showed in the menu
        .attr("value", function (d) { return d; }) // corresponding value returned by the button
    }
  
    // When the button is changed, run the updateChart function
    d3.select("#selectCivButtonLeft").on("change", function(d) {
      // recover the option that has been chosen
      let selectedOption = d3.select(this).property("value")
  
      selectedOption = civs.filter(d => d['name'] == selectedOption)[0]
      // run the updateChart function with this selected option
      updateUnitButton(selectedOption, "#selectUnitButtonLeft")
      civTechsLeft = updateCivTechs(selectedOption)
    })
  
    // When the button is changed, run the updateChart function
    d3.select("#selectCivButtonRight").on("change", function(d) {
      // recover the option that has been chosen
      let selectedOption = d3.select(this).property("value")
  
      selectedOption = civs.filter(d => d['name'] == selectedOption)[0]
      // run the updateChart function with this selected option
      updateUnitButton(selectedOption, "#selectUnitButtonRight")
      civTechsRight = updateCivTechs(selectedOption)
    })
  
  })
  
  let text_stats =[
    {gameName:'populationcount', niceName: 'Population'},
    {gameName:'maxvelocity', niceName: 'Speed', subtype: 'MaximumVelocity'},
    {gameName:'maxrunvelocity', niceName: 'Max Speed'},
    {gameName:'turnrate', niceName: 'Turn Rate'},
    {gameName:'maxhitpoints', niceName: 'Hitpoints', subtype: 'Hitpoints'},
    {gameName:'los', niceName: 'Line of Sight', subtype: 'LOS'},
    {gameName:'trainpoints', niceName: 'Train Points', subtype: 'TrainPoints'},
    {gameName:'bounty', niceName: 'XP Bounty'},
  
  ];
  
  function getAllEffects(tech_list){
    effects = tech_list.map(function(age0Civ){
      age0Civ = Array.from(techtree.children).filter(d => d.attributes["name"].value == age0Civ)[0]
      return Array.from(age0Civ.getElementsByTagName("effect"))
    })
    return [].concat(...effects)
  }
  
  function updateCivTechs(selectedCiv){
    effects = getAllEffects(selectedCiv['techs'])
    civTechs = effects.filter(d => d.attributes['type'].value=="TechStatus" ).map(d => d.textContent)
    civTechs = civTechs.concat(selectedCiv['cards'])
    return civTechs
  }
  
  function calcModifier(record, effect, relativity){
    if (effect.attributes['unittype'] != undefined){
      if(effect.attributes['unittype'].value != record['type'] ){
      return record
      }
    }
    if (relativity == 'BasePercent'){
      record['BasePercent'] = record['BasePercent'] + parseFloat(effect.attributes['amount'].value) - 1.0
    }
    if (relativity == 'Absolute'){
      record['Absolute'] = record['Absolute'] + parseFloat(effect.attributes['amount'].value)
    }
    return record
  };
  
  function applyEffect(effect, stat_table_data){
    stat_table_data = stat_table_data.map(function(record){
    if(effect.attributes['subtype'].value==record['subtype']){
          record = calcModifier(record, effect, effect.attributes['relativity'].value)
    }
    if(effect.attributes['action'] != undefined){
      // record['tag'] = damagebonus, record['type'] = Building, 
      if(effect.attributes['subtype'].value.toLowerCase() == record['tag'] && record['niceName'].includes(effect.attributes['action'].value ) ){
        console.log("building", record)    
        record = calcModifier(record, effect, effect.attributes['relativity'].value)
      }
    }
    if(effect.attributes['subtype'].value=='DamageForAllHandLogicActions' && record['damagetype'] == "Hand" &&  record['tag'] == "damage"){
          record = calcModifier(record, effect, effect.attributes['relativity'].value)
    }
    if(effect.attributes['allactions'] != undefined){
      if(effect.attributes['subtype'].value =='DamageBonus' && effect.attributes['allactions'].value=='1' &&  record['tag'] == "damagebonus" ){
            record = calcModifier(record, effect, effect.attributes['relativity'].value)
      }
      if(effect.attributes['subtype'].value=='Damage' && effect.attributes['allactions'].value=='1' &&  record['tag'] == "damage"){
            record = calcModifier(record, effect, effect.attributes['relativity'].value)
      }
    }
    return record
    })
    return stat_table_data
  }
  
  function calcUnmodifiedUnitStats(unit){
    stat_table_data = [];
    stat_table_data = text_stats.map(function(d){
      d['baseValue'] = parseFloat(unit.getElementsByTagName(d['gameName'])[0].textContent)
      d['BasePercent'] = 0.0
      d['Absolute'] = 0.0
      d['tag'] = ""
      d['type'] = ""
      return d
    })
  
    tags = Array.from(unit.getElementsByTagName("unittype")).map(d => d.textContent)
    tags.push(unit.attributes['name'].value)
    
    armor = unit.getElementsByTagName("armor")[0]
    stat_table_data.push({
      gameName: 'armor' + armor.getAttribute("type"),
      niceName: 'Resists ' + armor.getAttribute("type"),
      baseValue: parseFloat(armor.getAttribute("value")),
      armortype: armor.getAttribute("type"),
      BasePercent: 0.0,
      Absolute: 0.0,
    })
  
    // cost = Array.from(unit.getElementsByTagName("Cost")).map(d => d.textContent + " " + d.attributes['resourcetype'].value )
    // stat_table_data.push({
    //   gameName:'Cost', niceName: 'Cost', baseValue: cost.join(", ")
    // })
  
    protoaction_tags = ['damage', 'maxrange', 'rof', 'damagecap', 'damagearea', 'damagebonus']
    protoactions = unit.getElementsByTagName("protoaction")
    Array.from(protoactions).filter(d => d.children[0].textContent.includes("Attack")).forEach(function(protoAction){
      record = {}
      attackname = protoAction.getElementsByTagName('name')[0].textContent
      myname = protoAction.getElementsByTagName('name')[0].textContent + " (" + protoAction.getElementsByTagName('damagetype')[0].textContent + ") "
  
      Array.from(protoAction.children).filter(d => protoaction_tags.includes(d.tagName)).forEach(function(item){
        record = {
          niceName: myname + item.tagName,
          baseValue: parseFloat(item.textContent),
          BasePercent: 0.0,
          Absolute: 0.0,
          damagetype: protoAction.getElementsByTagName('damagetype')[0].textContent,
          tag: item.tagName,
          attackName: protoAction.getElementsByTagName('name')[0].textContent,
        }
        if("type" in item.attributes){
          record['niceName'] = record['niceName'] + " " + item.attributes['type'].value
          record['type'] = item.attributes['type'].value
        }
      stat_table_data.push(record)
      if (record['niceName'] == "BuildingAttack (Siege) damage"){
        stat_table_data.push({
          Absolute: 0,
          BasePercent: 0,
          baseValue: 1,
          damagetype: "Siege",
          niceName: "BuildingAttack (Siege) damagebonus Building",
          tag: "damagebonus",
          type: "Building"
          })
      }})
    })
    return stat_table_data
  }
  
  function calcUnitStats(unit, techs){
    stat_table_data = calcUnmodifiedUnitStats(unit)
    techs.forEach(function(tech){
    // for each effect, 
    // for each target,
    // for each tag
    // check if applicable
    effects = Array.from(tech.getElementsByTagName("effects")[0].children).forEach(function(effect){
      targets = Array.from(effect.getElementsByTagName("target")).forEach(function(target){
        if(tags.includes(target.textContent)){
          stat_table_data = applyEffect(effect, stat_table_data)
        }
      });
    })
    })
    stat_table_data = stat_table_data.map(function(d){
      d['modifiedValue'] = d['baseValue'] * (1.0 + d['BasePercent']) + d['Absolute']
      return d
    })
    return stat_table_data
  }
  unit_stats = {}
  unit_tags = {}
  function updateUnitStats(unit, techs, side) {
    stat_table_data = calcUnitStats(unit, techs)
    unit_stats[side] = JSON.parse(JSON.stringify(stat_table_data));
    // column definitions
    let columns = [
        { head: 'Statistic', cl: 'left-align', html: d => d['niceName'] },
        { head: 'Base', cl: 'right-align', html: d => d['baseValue'] },
        { head: '+%', cl: 'center', html: function(d){
          if(d['BasePercent']== 0){
             return ''
            }
          return d3.format(".0%")(d['BasePercent'])
         }
         },
        { head: '+abs', cl: 'center', 
        html: function(d){
          if(d['Absolute']== 0){
             return ''
            }
          return d['Absolute']
         }
         },
        { head: 'Modified', cl: 'right-align', html: d => d3.format(".2f")(d['modifiedValue']) },
    ];
  
    // create table
    let table = d3.select('.stats.'+side).html("")
  
    // create table header
    table.append('thead').append('tr')
        .selectAll('th')
        .data(columns).enter()
        .append('th')
        .attr('class', 'title')
        .text(d => d['head']);
  
    // create table body
    table.append('tbody')
        .selectAll('tr')
        .data(stat_table_data).enter()
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
  
    function length() {
        let fmt = d3.format('02d');
        return function(l) { return Math.floor(l / 60) + ':' + fmt(l % 60) + ''; };
    }
  }
  
  function gatherUnitTechs(unit, civTechs){
    tags = Array.from(unit.getElementsByTagName("unittype")).map(d => d.textContent)
    tags.push(unit.attributes['name'].value)
  
    relevant_techs = Array.from(techtree.children).filter(function(tech){
      effects_parent = tech.getElementsByTagName("effects")
      if (effects_parent.length == 0){
        return false}
      effects = Array.from(tech.getElementsByTagName("effects")[0].children).filter(function(effect){
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
        (hasElementWithTextContent(d, "flag", "UpgradeTech") || ["PaperCartridge"].includes(d.attributes['name'].value) ) )
    hc_techs = relevant_techs.filter(d => civTechs.includes(d.attributes['name'].value) && 
        ( hasElementWithTextContent(d, "flag", "HomeCity") || hasElementWithTextContent(d, "flag", "YPConsulateTech") ))
    team_techs = relevant_techs.filter(d => !hc_techs.includes(d) && 
        hasElementWithTextContent(d, "flag", "HomeCity")  && 
        hasElementWithTextContent(d, "flag", "TeamTech") )
    native_techs = relevant_techs.filter(d => hasElementWithTextContent(d, "flag", "YPNativeImprovement") )
    return [research_techs, hc_techs, team_techs, native_techs]
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
            relevant_techs = gatherUnitTechs(unit, civTechs)
            active_techs = Array.from(d3.selectAll('.card.active.'+side)._groups[0]).map(d =>  d.children[0].attributes['title'].value)
            console.log(unit, active_techs, relevant_techs)
            active_techs = relevant_techs.filter(d => active_techs.includes(d.attributes['name'].value))
            console.log(unit, active_techs)
            updateUnitStats(unit, active_techs, side)
            updateBreakpoints('left', 'right')
            updateBreakpoints('right', 'left')
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
  function calcBreakpoints(attacker_side, defender_side){
  
  attacker_stat_table_data = unit_stats[attacker_side]
  defender_stat_table_data = unit_stats[defender_side]
  defender_tags = unit_tags[defender_side].map( d => d['tag'])
  
  defender_hp = defender_stat_table_data.filter(d => d['gameName'] == 'maxhitpoints')[0]['modifiedValue']
  
  console.log(attacker_side, defender_side, defender_stat_table_data.filter(d => d['gameName'] == 'maxhitpoints'))
  
  attackNames = new Set(attacker_stat_table_data.filter(d => d['attackName'] ).map(d => d['attackName']))
  sdf =['BuildingAttack', 'ChopAttack', 'HandAttackCrate']
  sdf.forEach(d => attackNames.delete(d) )
  breakpoints_data = Array.from(attackNames).map(function(attackName){
    attack_stat_table_data = attacker_stat_table_data.filter(d => d['attackName'] ==  attackName)
    console.log(attackName)
    attack_damage = attack_stat_table_data.filter(d => d['tag'] ==  'damage')[0]['modifiedValue']
    attack_rof = attack_stat_table_data.filter(d => d['tag'] ==  'rof')[0]['modifiedValue']
  
    attack_damagebonus = attack_stat_table_data.filter(d => defender_tags.includes(d['type']) )
    attack_damagebonus = attack_damagebonus.filter(d => d['tag'] == 'damagebonus').map(d => d['modifiedValue'])
    attack_damagebonus = attack_damagebonus.reduce( (a, b) => a * b, 1)
    
    defend_armor = defender_stat_table_data.filter(d => d['armortype'])[0]
    damagetype = attack_stat_table_data.filter(d => d['tag'] ==  'damage')[0]['damagetype']
    if(defend_armor['armortype'] == damagetype){
      defend_resists = defend_armor['modifiedValue']
    } else{
      defend_resists = 0.0
    }
  
    effective_damage = attack_damage * attack_damagebonus * (1-defend_resists)
    record = {
      'attackName': attackName,
      'damage': attack_damage,
      'damagebonus': attack_damagebonus,
      'rof': attack_rof,
      'resists': defend_resists,
      'effective_damage': effective_damage,
      'hitpoints': defender_hp,
      'shots_required': defender_hp / effective_damage,
    }  
    return record
    })
  return breakpoints_data
  }
  function updateBreakpoints(attacker_side, defender_side){
    breakpoints_data = calcBreakpoints(attacker_side, defender_side)
  
    let columns = [
      { head: 'Attack Name', cl: 'title', html: d => d['attackName'] },
      { head: 'Damage', cl: 'right-align', html: d => d3.format(".2f")(d['damage']) },
      { head: 'Multiplier', cl: 'right-align', html: d => d['damagebonus'] },
      { head: 'ROF', cl: 'right-align', html: d => d['rof'] },
      { head: 'Resists', cl: 'right-align', html: d => d['resists'] },
      { head: 'Effective damage', cl: 'right-align', html: d => d3.format(".2f")(d['effective_damage']) },
      { head: 'Hitpoints', cl: 'right-align', html: d => d3.format(".2f")(d['hitpoints']) },
      { head: 'Shots required', cl: 'right-align', html: d => d3.format(".2f")(d['shots_required']) },
    ]
    let table = d3.select('.breakpoints.'+attacker_side).html("")
  header = unit_tags[attacker_side].map( d => d['tag']).slice(-1)[0] + " (" + attacker_side + 
    ") attacking " + unit_tags[defender_side].map( d => d['tag']).slice(-1)[0] + " (" + defender_side +")"
  // create table header
  thead = table.append('thead')
  
  thead.append('tr')
        .selectAll('th')
        .data(["sdf"]).enter()
        .append('th')
        .text(header)
        .attr('colspan',100 );
  
  thead.append('tr')
    .selectAll('th')
    .data(columns).enter()
    .append('th')
    .text(d => d['head']);
  
  // create table body
  table.append('tbody')
    .selectAll('tr')
    .data(breakpoints_data).enter()
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
  d3.select("#selectUnitButtonLeft").on("change", function(d) {
    let selectedUnit = d3.select(this).property("value")
    unit = militaryUnits.filter(d => d.attributes['name'].value == selectedUnit)[0]
    updateUnitStats(unit, [], "left")
    updateUnitTechs(unit, civTechsLeft, "left")
    updateTags(unit, "left")
    updateBreakpoints('left', 'right')
    updateBreakpoints('right', 'left')
  })
  
  d3.select("#selectUnitButtonRight").on("change", function(d) {
    let selectedUnit = d3.select(this).property("value")
    unit = militaryUnits.filter(d => d.attributes['name'].value == selectedUnit)[0]
    updateUnitStats(unit, [], "right")
    updateUnitTechs(unit, civTechsRight, "right")
    updateTags(unit, "right")
    updateBreakpoints('left', 'right')
    updateBreakpoints('right', 'left')
  
  console.log(breakpoints_data)
  })
  