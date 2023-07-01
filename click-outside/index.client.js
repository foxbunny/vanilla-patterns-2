requestIdleCallback(start)

function start() {
	$trigger.addEventListener('click', () => {
		// To understand the code below, please keep in mind that the 'clickoutside' event is a proxy for clicks that bubble
		// up to document.body, but do not originate from within the click boundary defined using a custom element. To work
		// around this, we set up the 'clickoutside'.

		// While this listener is executing the event is travelling towards the document.body. Any code we executed here, is
		// executed before the listener in the custom element that generates the 'clickoutside' event.

		// First we set a callback to open the dialog with a delay. The delay is used because of an edge case where the
		// dialog is closed by using the Escape key rather than by clicking outside the dialog. In this case, the
		// 'clickoutside' listener will remain attached despite the dialog being closed, and it will invoke the close()
		// method after showModal() method is called, which effectively makes the trigger button inoperable indefinitely.
		// By adding a delay, we allow the close() method to be called first, followed by showModal(), restoring the
		// intended behavior of the trigger.
		//
		// As an alternative, we could also remove the 'clickoutside' listener when the user uses the Escape key to close
		// the dialog, but that would require more code.
		setTimeout(() => $dialog.showModal())

		// Then we add a 'clickoutside' event handler, also with a delay. The delay ensures that the bubbling of the click
		// event being handled at this point in time does not eventually cause the 'clickoutside' event handler to be
		// immediately invoked.
		setTimeout(() => $dialog.addEventListener('clickoutside', () => {
			$dialog.close()
		}, {once: true}))
	}, false)
}

let $trigger = document.getElementById('open-box')
let $dialog = document.getElementById('dialog')

// We use a custom element for this because it has a clean-up method that can be used to remove the listener when no
// longer needed and thus prevent memory leaks.
customElements.define('click-boundary', class extends HTMLElement {
	constructor() {
		super()
		// Create a stable reference to this method
		this.documentLevelClickListener = this.documentLevelClickListener.bind(this)
	}

	connectedCallback() {
		this.addEventListener('click', ev => {
			// We mark the click boundary so that we can tell whether the click happened inside the boundary or not. As the
			// event bubbles, this same event object is passed along all the way to the document.body where we have another
			// listener waiting for it.
			ev.clickBoundary = this
		})
		window.addEventListener('click', this.documentLevelClickListener, false)
	}

	disconnectedCallback() {
		window.removeEventListener('click', this.documentLevelClickListener, false)
	}

	documentLevelClickListener(originalEvent) {
		// We check for click boundary markers and if the marker matches this custom element, we ignore the event. Because
		// we are using an instance of the custom element as the marker, we tell whether the marker refers to this or
		// another boundary.
		if (originalEvent.clickBoundary == this) return
		// Create a custom 'clickoutside' event. We are allowing it to bubble up the DOM tree so that we don't need to
		// pinpoint select the custom element in order to handle it.
		let ev = new Event('clickoutside', {bubbles: true})
		// (optional) Make the original event available as `event.upstream`
		ev.upstream = originalEvent
		// Dispatch the event
		this.dispatchEvent(ev)
		// To make this custom element behave like native elements, we also handle the `onclickoutside` method if assigned
		if (typeof this.onclickoutside == 'function') this.onclickoutside(ev)
	}
})
