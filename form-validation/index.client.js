requestIdleCallback(start)

function start() {
	// We can use the HTMLFormElement.elements property to find all form fields.
	for (let $ of $form.elements) {
		$.addEventListener('invalid', ev => {
			ev.preventDefault()
			applyValidity($)
			document.querySelector('input:invalid').focus()
		})
		$.addEventListener('blur', () => applyValidity($))
	}
	$form.addEventListener('submit', ev => {
		ev.preventDefault()
		for (let $ of $form.elements) applyValidity($)
	})
	// Custom constraint
	$form.elements.nice.addEventListener('input', ev => {
		// This code just sets the validation error message. The message is not displayed until either the user leaves the
		// field or the form is submitted.

		if (ev.target.value.toLowerCase() != 'something nice')
			ev.target.setCustomValidity('Please write "something nice"')
		else
			// This clears the message
			ev.target.setCustomValidity('')
	})
}

let $form = document.querySelector('form')

function applyValidity($input) {
	// This function is only concerned with the *presentation* of the error messages, and does not perform any validation.
	// Validation is performed entirely by the browser.

	// Locate the error <span> by using the input name
	let $error = document.getElementById($input.name + '-error')
	// Also find the label element
	let $label = $input.closest('label')

	// The error <span> must be hidden if there are no errors so that screen readers do not announce it by accident
	$error.hidden = $input.validity.valid

	// The label itself is marked as .invalid on validation error. This affects the styling of the input.
	$label.classList.toggle('invalid', !$input.validity.valid)

	if ($input.validity.valid) {
		// A valid input should not have the aria-invalid attribute
		$input.removeAttribute('aria-invalid')
		// It can have the aria-errormessage attribute, but we remove it anyway
		$input.removeAttribute('aria-errormessage')
		// We make sure the error <span> does not contain any error messages
		$error.textContent = ''
	}
	else {
		// Must have aria-invalid set to true
		$input.setAttribute('aria-invalid', 'true')
		// We can use the $input.validationMessage to populate the error <span>. This causes the screen reader to announce it.
		$error.textContent = $input.validationMessage
	}
}
