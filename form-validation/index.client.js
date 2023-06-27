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
}

let $form = document.querySelector('form')

function applyValidity($input) {
	// This function is only concerned with the *presentation* of the error messages, and does not perform any validation.
	// Validation is performed entirely by the browser.
	let $error = document.getElementById($input.name + '-error')
	let $label = $input.closest('label')
	$error.hidden = $input.validity.valid
	$label.classList.toggle('invalid', !$input.validity.valid)
	if ($input.validity.valid) {
		$input.removeAttribute('aria-invalid')
		$input.removeAttribute('aria-errormessage')
		$error.textContent = ''
	}
	else {
		$input.setAttribute('aria-invalid', 'true')
		$input.setAttribute('aria-error', $error.id)
		$error.textContent = $input.validationMessage
	}
}
