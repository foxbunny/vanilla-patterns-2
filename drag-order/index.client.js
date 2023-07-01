requestIdleCallback(start)

function start() {
	// Add the drag ghost to the document
	document.body.append($dragGhost)

	// Mark the form as having drag & drop enabled
	$form.toggleAttribute('data-drag-enabled', true)

	// Mark fieldsets as having drag & drop enabled
	for (let $ of $form.children) if ($.tagName == 'FIELDSET') {
		// Make all fieldsets as draggable
		$.draggable = true
		// Hide the priority field because it will be controlled by our drag and
		// keyboard actions
		$.querySelector('[name=priority]').type = 'hidden'
		// Add a note for ATs that keyboard can be used to change the priority
		$.setAttribute('aria-label', "Task (use Up and Down arrow keys to change the priority)")
	}

	// Drag & drop events

	$form.addEventListener('dragstart', ev => {
		markTaskAsDragging(ev.target)
		markFormAsDragging()
		// If this was triggered by a real drag event, then set the drag ghost
		ev.dataTransfer?.setDragImage($dragGhost, 0, 0)
	})

	$form.addEventListener('dragover', ev => {
		// dragover will also trigger on the form itself, which we ignore
		if (!ev.target.matches('fieldset')) return

		let $task = $form.$draggedItem
		let $target = ev.target

		// If we are currently swapping elements, do nothing
		if ($task.isAnimating) return
		// If we're dragging over the element being dragged, ignore it
		if ($task === $target) return

		swapElements($task, $target)
	})

	$form.addEventListener('dragend', () => {
		unmarkTaskAsDragging()
		unmarkFormAsDragging()
		updateTaskPriorities()
	})

	// Simulate drag & drop on touch devices that don't support drag events.

	$form.addEventListener('touchstart', ev => {
		let $task = ev.touches[0].target
		if (!$task.draggable) return // Probably not a task

		// Preventing the default action also prevents scrolling.
		ev.preventDefault()

		// Don't start dragging immediate in case user changes their mind.
		$form.dragStartTimeout = setTimeout(() => {
			console.log('here')
			$task.dispatchEvent(new Event('dragstart', {bubbles: true}))
		}, dragStartDelay)
	})

	$form.addEventListener('touchmove', ev => {
		if (!$form.$draggedItem) return

		let {clientX, clientY} = ev.touches[0]
		let $target = document.elementFromPoint(clientX, clientY)?.closest('form > fieldset')
		let $draggable = $form.$draggedItem

		// The native drag system will automatically scroll as the item is dragged. This is not the case with touchmove, so
		// we need to simulate this behavior.
		if (clientY < dragScrollTopMargin) window.scrollBy({top: -dragScrollTopMargin, behavior: 'smooth'})
		if (clientY > window.innerHeight - dragScrollBottomMargin) window.scrollBy({
			top: dragScrollBottomMargin,
			behavior: 'smooth',
		})

		// Don't go further if there's nothing to do
		if (!$target || $target === $draggable) return

		// Delegate to dragover
		$target.dispatchEvent(new Event('dragover', {bubbles: true}))
	})

	$form.addEventListener('touchend', () => {
		// If we are not in drag mode, just ignore the event
		if (!$form.$draggedItem) return
		// Cancel drag in case it hasn't started yet
		clearTimeout($form.dragStartTimeout)
		// Delegate to dragend
		$form.$draggedItem.dispatchEvent(new Event('dragend', {bubbles: true}))
	})

	// Keyboard interaction

	$form.addEventListener('keydown', ev => {
		// If the keydown event comes from some other element, don't do anything.
		if (!ev.target.matches('fieldset')) return

		// If we are already dragging, don't do anything.
		if ($form.$draggedItem) return

		let $task = ev.target

		switch (ev.code) {
			case 'ArrowUp':
				// Prevent the arrow key from scrolling the page
				ev.preventDefault()
				// No viable targets?
				if (!$task.previousElementSibling) return
				swapElementsAtomically($task, $task.previousElementSibling)
				break
			case 'ArrowDown':
				// Prevent the arrow key from scrolling the page
				ev.preventDefault()
				// No viable targets?
				if (!$task.nextElementSibling) return
				swapElementsAtomically($task, $task.nextElementSibling)
				break
		}
	})
}

let $form = document.getElementById('tasks')
let $dragGhost = Object.assign(document.createElement('div'), {hidden: true})

let dragStartDelay = 1000
let dragScrollTopMargin = 200
let dragScrollBottomMargin = 60
let shortAnimation = 50

function swapElements($task, $target, animationDuration = 150) {
	// Initialize the FLIP animation
	let taskFLIP = startFLIP($task, animationDuration)
	let targetFLIP = startFLIP($target, animationDuration)

	// We need to decide how to swap the elements. If the target is above the task being dragged, then we can swap them
	// using `insertBefore()`.
	if ($task.offsetTop > $target.offsetTop) $form.insertBefore($task, $target)
	// If the target is below the task being dragged, we have two options. The first option is that the target has a next
	// sibling fieldset, in which case we can swap the dragged task with that sibling.
	else if ($target.nextElementSibling) $form.insertBefore($task, $target.nextElementSibling)
	// If the target has no next sibling, it means we're at the end of the list, so we can simply append the dragged task.
	else $form.append($task)
	// Note that in all of the above cases, inserting/appending the dragged task automatically removes it from the previous
	// location because DOM nodes cannot exist in two places at once.

	// Run the animations and resolve when both are finished
	return Promise.all([taskFLIP.run(), targetFLIP.run()])
}

function swapElementsAtomically($task, $target) {
	// The target may be a button
	if ($target.tagName != 'FIELDSET') return
	markTaskAsDragging($task)
	// Use shorter animation to better responsiveness when using a keyboard
	swapElements($task, $target, shortAnimation)
		.then(unmarkTaskAsDragging)
	updateTaskPriorities()
	// After swapping, the task that had focus will lose it. We need to refocus the task, so we can keep moving it.
	$task.focus()
}

function updateTaskPriorities() {
	// Once reordering is done, we need to reassign priorities. We are going to use the element's index within the node
	// list for this.
	for (let i = 0; i < $form.children.length; i++) {
		let $child = $form.children[i]

		if ($child.tagName === 'FIELDSET')
			// Just like the form element, fieldsets also support the `elements` property which gives us access to named
			// fields within it
			$child.elements.priority.value = i + 1
	}
}

function unmarkFormAsDragging() {
	delete $form.dataset.dragging
}

function markFormAsDragging() {
	$form.dataset.dragging = true
}

function unmarkTaskAsDragging() {
	delete $form.$draggedItem.dataset.dragging
	delete $form.$draggedItem
}

function markTaskAsDragging($task) {
	$form.$draggedItem = $task
	$task.dataset.dragging = true
}

function startFLIP($, animationDuration) {
	// More about FLIP animation:
	//
	// https://css-tricks.com/animating-layouts-with-the-flip-technique/

	// Remember the initial Y position
	let initialY = $.offsetTop

	return {
		run: () => {
			// Get the final Y position
			let finalY = $.offsetTop
			// Animate from initial to final Y position as if the element is starting
			// to move just now.
			let animation = $.animate([
				{transform: `translateY(${initialY - finalY}px`},
				{transform: 'none'},
			], {duration: animationDuration})
			// Mark the element as animating so that we can prevent multiple
			// animation for the same element from starting in parallel
			$.isAnimating = true
			// We return a promise that resolves once the animation ends. This
			// gives us synchronization between multiple animations for free via
			// Promise.all().
			return new Promise(res => {
				animation.addEventListener('finish', () => {
					delete $.isAnimating
					res()
				})
			})
		},
	}
}

