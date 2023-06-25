requestIdleCallback(start)

function start() {
	setInterval(updateOutput, 1000)
	updateOutput()
}

let $output = document.getElementById('clock')
//            document.querySelector('#clock')

function updateOutput() {
	$output.textContent = new Date().toLocaleTimeString('de', {hour: '2-digit', minute: '2-digit', second: '2-digit'})
}