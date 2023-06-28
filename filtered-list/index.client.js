requestIdleCallback(start)

function start() {
	updatePageFromURL()
	$thead.addEventListener('click', ev => {
		let $btn = ev.target.closest('button[value]')
		if (!$btn || $btn.disabled) return
		setSort($btn.value)
	})
	$filters.addEventListener('input', ev => {
		// This is a delegated event listener in which we assume that Event.target is always the right target. Since input
		// events can only come from input controls, and we only have relevant input controls under $filters, we can safely
		// make this assumption.

		// We debounce the event handler: delay execution until a certain amount of time has elapsed since the last event in
		// order to avoid touching the DOM until user has made up their mind about what they would like to do.

		// Step 1: cancel any scheduled handler
		clearTimeout(ev.target.debounceTimer)
		// Step 2: schedule a handler to execute in 0.3s (300ms), and store the reference to the timer. The timeout value is
		// arbitrary in this case. It should be fine-tuned to provide the best responsiveness.
		ev.target.debounceTimer = setTimeout(setFilter, 300, ev.target.name, ev.target.value)
	})
	window.addEventListener('popstate', updatePageFromURL)
}

let $table = document.getElementById('colors')
let $thead = $table.querySelector('thead')
let $tbody = $table.querySelector('tbody')
let tableHeaders = [
	{key: 'color', $: $table.querySelector('thead th:nth-child(2)')},
	{key: 'stock', $: $table.querySelector('thead th:nth-child(3)')},
]
let $filters = document.getElementById('filters')
let $note = document.querySelector('[aria-live]')

let ascending = true
let descending = false
let sortField = ''
let sortDir = ascending
let validSortColumns = ['color', 'stock']
let filters = {
	color: '',
	stock: 0,
}
let filterTypes = {
	color: String,
	stock: Number,
}

// We map from sort parameters to a more human-sounding text for the sort order announcement aimed at screen readers.
let sortDirectionNoteText = {
	color: {
		[ascending]: 'alphabetically by color',
		[descending]: 'in reverse alphabetical order by color',
	},
	stock: {
		[ascending]: 'by stock, low first',
		[descending]: 'by stock, high first',
	},
}

// We map from sort parameters to sort functions by sort field and direction
let sortFunctions = {
	color: {
		true: ($a, $b) => getColor($a).localeCompare(getColor($b)),
		false: ($a, $b) => getColor($b).localeCompare(getColor($a)),
	},
	stock: {
		true: ($a, $b) => getStock($a) - getStock($b),
		false: ($a, $b) => getStock($b) - getStock($a),
	},
}

function updatePageFromURL() {
	// All of our sorting and filtering is controlled by the URL. This is the so-called "one-way" data flow, where the
	// flow looks like this:
	//
	// UI event -> url -> URL event -> DOM
	//
	// You will see in the rest of the code that we always update the URL and let this function take care of the rest. It
	// is slightly less efficient because the sorting and filtering are always applied together, even if we only changed
	// one or the other, but it allows us to achieve bookmarkable application state and back button functionality with
	// the least amount of moving parts.
	//
	// We could make this more efficient by keeping track of the previous value and ensuring DOM operations are only
	// applied when the state actually changes, but it's not necessary in this particular example.

	let params = new URLSearchParams(location.search)
	let sortFieldParam = getStringParam(params, 'sort')

	sortField = validSortColumns.find(field => field == sortFieldParam) || ''
	sortDir = getBoolParam(params, 'asc')
	filters.color = getStringParam(params, 'color')
	filters.stock = getNumericParam(params, 'stock')

	updateTableHeader()
	updateTable()
	updateSortOrderNote()
}

function updateTableHeader() {
	// The aria-sort attribute is used to mark headers that are sorted. Headers that are not sorted should not have this
	// attribute at all. We rigged the `sortDir` variable so that we can map it to the correct value for the `aria-sort`
	// attribute with a bit less code.
	tableHeaders.forEach(({key, $}) => {
		if (key != sortField) $.removeAttribute('aria-sort')
		else $.setAttribute('aria-sort', sortDir ? 'ascending' : 'descending')
	})
}

function updateTable() {
	// Note that these two operations are completely independent and we do not care what order they are executed in. They
	// will always have the same effect.
	applySort()
	applyFilters()
}

function applySort() {
	// Step 1: We create an array of rows.
	let $$rows = [...$tbody.children]
	// Step 2: We then sort this array
	$$rows.sort(sortFunctions[sortField]?.[sortDir] || noSort)
	// Step 3: Append each row to the list in array order. Because elements cannot coexist in two places at once,
	// appended rows are automatically removed from their original position, resulting in a correctly sorted list.
	$$rows.forEach($ => $tbody.append($))
}

function applyFilters() {
	for (let $ of $tbody.children) $.hidden = !matchesFilters($)
}

function noSort() {
	return 1
}

function matchesFilters($row) {
	let color = getColor($row)
	let stock = getStock($row)
	let matchesColor = !filters.color || color.toLowerCase().includes(filters.color.toLowerCase())
	let matchesStock = stock >= filters.stock
	return matchesColor && matchesStock
}

function getColor($row) {
	return $row.querySelector('td:nth-child(2)').textContent
}

function getStock($row) {
	return Number($row.querySelector('td:last-child').textContent)
}

function updateSortOrderNote() {
	if (!sortField) $note.textContent = ''
	else $note.textContent = `The table is now sorted ${sortDirectionNoteText[sortField][sortDir]}.`
}

function setSort(column) {
	if (column == sortField) {
		sortField = column
		if (sortDir == ascending) sortDir = descending
		else sortField = ''
	}
	else {
		sortField = column
		sortDir = ascending
	}
	updateURL()
}

// Helpers for working with query params

function getNumericParam(params, name, defaultValue = 0) {
	return Number(params.get(name) || defaultValue)
}

function getStringParam(params, name) {
	return params.get(name) || ''
}

function getBoolParam(params, name) {
	return params.get(name) == 'true'
}

function setFilter(name, value) {
	filters[name] = filterTypes[name](value)
	updateURL()
}

function updateURL() {
	let url = new URL(location)
	let params = url.searchParams

	if (sortField) {
		params.set('sort', sortField)
		params.set('asc', sortDir)
	}
	else {
		params.delete('sort')
		params.delete('asc')
	}

	if (filters.color) params.set('color', filters.color)
	else params.delete('color')

	if (filters.stock) params.set('stock', filters.stock)
	else params.delete('stock')

	history.pushState(null, '', url)
	window.dispatchEvent(new Event('popstate'))
}
