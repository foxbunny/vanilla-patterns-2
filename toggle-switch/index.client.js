requestIdleCallback(start)

function start() {
	$toggle.addEventListener('change', updateNotificationState)
}

let $toggle = document.getElementById('notifications-enabled')
let $output = document.getElementById('notification-state')

function updateNotificationState() {
	$output.textContent = `In-app notifications are ${$toggle.checked ? 'enabled' : 'disabled'}`
}