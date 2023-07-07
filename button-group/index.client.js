requestIdleCallback(start)

function start() {
	$input.addEventListener('change', () => {
		// Sadly, there is no way to access the selected radio other than iterating over all of them, or by using
		// querySelector as we do here. Note that here we do not need to perform a null check on the return value from
		// querySelector as there is no way to 'unselect' a radio.
		let {value} = $input.querySelector(':checked')
		updateOutput(value)
	})
}

let $input = document.getElementById('group')
let $output = document.getElementById('output')

let labels = {
	'1y': '1-year',
	'2y': '2-year',
	'5y': '5-year',
	'all': 'complete',
}

function updateOutput(val) {
	$output.textContent = `Selected the ${labels[val]} interval`
}