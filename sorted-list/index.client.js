requestIdleCallback(start)

function start() {
	updatePageFromURL()
	$$prevPage.forEach($btn => $btn.addEventListener('click', () => goToPage(page - 1)))
	$$nextPage.forEach($btn => $btn.addEventListener('click', () => goToPage(page + 1)))
	$thead.addEventListener('click', ev => {
		let $btn = ev.target.closest('button[value]')
		if (!$btn || $btn.disabled) return
		setSort($btn.value)
	})
	window.addEventListener('popstate', updatePageFromURL)
}

let $table = document.getElementById('colors')
let $thead = $table.querySelector('thead')
let $tbody = $table.querySelector('tbody')
let $$prevPage = document.querySelectorAll('[value=previous]')
let $$nextPage = document.querySelectorAll('[value=next]')
let tableHeaders = [
	{key: 'color', $: $table.querySelector('thead th:nth-child(2)')},
	{key: 'count', $: $table.querySelector('thead th:nth-child(3)')},
]
let $note = document.querySelector('[aria-live]')

let perPage = 12
let totalPages = 0
let page = 1
let ascending = true
let descending = false
let sortField = ''
let sortDir = ascending
let data = []
let validSortColumns = ['color', 'count']

// We map from sort parameters to a more human-sounding text for the sort order announcement aimed at screen readers.
let sortDirectionNoteText = {
	color: {
		[ascending]: 'alphabetically by color',
		[descending]: 'in reverse alphabetical order by color',
	},
	count: {
		[ascending]: 'by stock, low first',
		[descending]: 'by stock, high first',
	}
}

function updatePageFromURL() {
	let params = new URLSearchParams(location.search)
	page = getNumericParam(params, 'page', 1)
	sortField = validSortColumns.find(field => field == getStringParam(params, 'sort')) || ''
	sortDir = getBoolParam(params, 'asc')
	getColors().then(() => {
		updateTableHeader()
		updateSortOrderNote()
		updateTable()
		updatePaginator()
	})
}

function getColors() {
	return fetch('https://6497760983d4c69925a3aaa7.mockapi.io/colors')
		.then(res => res.json())
		.then(json => {
			data = json
			totalPages = Math.ceil(data.length / perPage)
			// Once we have the data, there's no longer a need for this function to do anything, so we 'disable' it by
			// assigning a no-op function.
			getColors = () => Promise.resolve()
		})
		.catch(() => {
			alert('There was an error fetching the data.')
		})
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
	let pageData = getPageData()

	// Pass 1: Update available rows
	pageData.forEach((rowData, index) => {
		// 1. Get a matching row. We are guaranteed to get a usable element because we ensured the pre-rendered row count is
		// always larger than or equal to the maximum number of data records.
		let $row = $tbody.children[index]

		// 2. We update the row with the data.
		$row.querySelector('td:first-child').textContent = rowData.id
		$row.querySelector('td:nth-child(2)').textContent = rowData.color
		$row.querySelector('td:last-child').textContent = rowData.count

		// 5. Remove the `hidden` attribute.
		$row.hidden = false
	})

	// Pass 2: Hide unpopulated rows when pageData.length < perPage
	for (let i = pageData.length; i < perPage; i++)
		$tbody.children[i].hidden = true
}

function getPageData() {
	let sortedData
	switch (sortField) {
		case 'color':
			sortedData = data.slice().sort(sortDir
				? (a, b) => a.color.localeCompare(b.color)
				: (a, b) => b.color.localeCompare(a.color)
			)
			break
		case 'count':
			sortedData =  data.slice().sort(sortDir
				? (a, b) => a.count - b.count
				: (a, b) => b.count - a.count
			)
			break
		default:
			sortedData = data
	}
	let startIndex = (page - 1) * perPage
	let endIndex = startIndex + perPage
	return sortedData.slice(startIndex, endIndex)
}

function updateSortOrderNote() {
	if (!sortField) $note.textContent = ''
	else $note.textContent = `The table is now sorted ${sortDirectionNoteText[sortField][sortDir]}.`
}

function updatePaginator() {
	$$prevPage.forEach($btn => $btn.disabled = page == 1)
	$$nextPage.forEach($btn => $btn.disabled = page == totalPages)
}

function goToPage(newPage) {
	// We use the URL object to update the 'page' query param. By doing so, we are ensuring that any other query
	// parameters that the app may be using are also accounted for.
	let url = new URL(location)
	url.searchParams.set('page', newPage)
	history.pushState(null, '', url)

	// We trigger the popstate event rather than invoke the updatePageFromURL(). This makes the popstate event handler the
	// single source of truth about how URL changes should be handled.
	window.dispatchEvent(new Event('popstate'))
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
	let url = new URL(location)
	if (sortField) {
		url.searchParams.set('sort', sortField)
		url.searchParams.set('asc', sortDir)
	}
	else {
		url.searchParams.delete('sort')
		url.searchParams.delete('asc')
	}
	url.searchParams.delete('page')
	history.pushState(null, '', url)
	window.dispatchEvent(new Event('popstate'))
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
