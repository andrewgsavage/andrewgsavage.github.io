
// Replaces the contents of the table at selector.
// columns: [{head, cl, html, color}] where cl, html and color are values or functions of (row, i)
// options.headerRows: rows of header cells, each a string or {text, colspan}; defaults to the column heads
// options.headerClass: class for every header cell
function renderTable(selector, columns, rows, options){
  options = options || {}
  let headerRows = options.headerRows || [columns.map(c => c['head'])]
  let table = d3.select(selector).html("")

  let thead = table.append('thead')
  headerRows.forEach(function(headers){
    thead.append('tr')
      .selectAll('th')
      .data(headers).enter()
      .append('th')
      .attr('class', options.headerClass)
      .attr('colspan', d => d['colspan'])
      .text(d => typeof d == 'string' ? d : d['text'])
  })

  table.append('tbody')
    .selectAll('tr')
    .data(rows).enter()
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
    .html(d => d['html'])
    .attr('class', d => d['cl'])
    .style('background-color', d => d['color'])
  return table
}
