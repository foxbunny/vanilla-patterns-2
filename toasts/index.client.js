requestIdleCallback(start)

function start() {
	// We use a custom event so we can fire the toast globally from
	// anywhere in the application.
	window.addEventListener('toast', createToast)

	$toastList.addEventListener('animationend', removeToast)
	$toastList.addEventListener('click', dismissToast)
	$triggers.addEventListener('click', triggerToast)
}

let $template = document.getElementById('toast').content
let $toastList = document.getElementById('toast-list')
let $triggers = document.getElementById('triggers')

function createToast(ev) {
	let {message, level} = ev.detail
	let $toast = $template.cloneNode(true).firstElementChild
	if (level == 'error') $toast.setAttribute('role', 'alert')
	$toast.dataset.level = level
	$toastList.append($toast)
	setTimeout(function () {
		$toast.firstElementChild.textContent = message
	}, 100)
}

function removeToast(ev) {
	// The toast has 3 animations:
	//
	// - fly in
	// - expire (progress bar)
	// - fly out
	//
	// This event listener handles all three.

	// We are not interested in the first animation. Since we don't know
	// which event handler is for the first animation, we have to mark
	// the element.
	if (!ev.target.firstAnimation) {
		ev.target.firstAnimation = true
		return
	}

	if (ev.target.dataset.clear)
		// If the toast is in clear mode, we remove it from the DOM.
		ev.target.remove()
	else
		// Toast is entered into pre-remove state by setting the
		// data-clear attribute. This triggers the CSS animation
		// that makes it fly off the screen.
		ev.target.dataset.clear = true
}

function dismissToast(ev) {
	// Toast is entered into pre-remove state by setting the
	// data-clear attribute. This triggers the CSS animation
	// that makes it fly off the screen.
	if (ev.target.closest('[value=dismiss]'))
		ev.target.closest('.toast').dataset.clear = true
}

function triggerToast(ev) {
	switch (ev.target.value) {
		case 'info':
			window.dispatchEvent(new CustomEvent('toast', {detail: {message: 'Something nice happened!', level: 'info'}}))
			break
		case 'error':
			window.dispatchEvent(new CustomEvent('toast', {detail: {message: 'OMG, you ruined it!', level: 'error'}}))
			break
	}
}