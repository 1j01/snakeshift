
var test = document.createElement('div')
test.style.position = 'absolute'
test.style.top = '50px'
test.style.left = '0'
test.style.width = '100%'
test.style.height = '10%'
test.style.backgroundColor = 'rgba(128, 128, 128, 0.5)'
test.textContent = 'This is a test div'
document.body.appendChild(test)
console.log("made test div!")

var grid = document.createElement('table')
// grid.style.borderCollapse = 'collapse'
// grid.style.width = '100%'
// grid.style.height = '100%'
// grid.style.tableLayout = 'fixed'
// // grid.style.borderSpacing = '0'
// grid.style.background = 'red'
document.body.appendChild(grid)
console.log("made grid table!")

var rows = 10
var cols = 10
for (var i = 0; i < rows; i++) {
  var row = document.createElement('tr')
  grid.appendChild(row)
  console.log("made row...", i)
  for (var j = 0; j < cols; j++) {
    console.log("1?")
    var cell = document.createElement('td')
    console.log("2?")
    cell.style.border = '4px solid gray'

    cell.style.width = '10%'
    cell.style.height = '10%'
    // cell.style.position = 'relative'
    // cell.dataset.x = j
    // cell.dataset.y = i
    console.log("3?")
    row.appendChild(cell)
    console.log("made cell", i, j)

    var button = document.createElement('button')
    // button.style.position = 'absolute'
    // button.style.top = '0'
    // button.style.left = '0'
    button.style.width = '100%'
    button.style.height = '100%'
    button.style.backgroundColor = 'rgb(255, 255, 255)'
    button.style.color = 'black'
    button.textContent = j + ',' + i
    cell.appendChild(button)
    console.log("made button", i, j)

    button.addEventListener('click', function (event) {
      // var x = event.target.parentElement.dataset.x
      // var y = event.target.parentElement.dataset.y
      var x = parseInt(event.target.textContent.split(',')[0])
      var y = parseInt(event.target.textContent.split(',')[1])
      console.log('Button clicked at:', x, y)
      alert('Button clicked at: ' + x + ', ' + y)
    })
  }
}
