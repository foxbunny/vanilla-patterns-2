requestIdleCallback(start)

function start() {
	updatePageFromURL()
	$$prevPage.forEach($btn => $btn.addEventListener('click', () => goToPage(page - 1)))
	$$nextPage.forEach($btn => $btn.addEventListener('click', () => goToPage(page + 1)))
	window.addEventListener('popstate', updatePageFromURL)
}

let $table = document.getElementById('colors')
let $tbody = $table.querySelector('tbody')
let $$prevPage = document.querySelectorAll('[value=previous]')
let $$nextPage = document.querySelectorAll('[value=next]')

let perPage = 12
let totalPages = 0
let page = 1
let data = []

function updatePageFromURL() {
	// Pagination is controlled by the URL. This is the so-called "one-way" data flow, where the flow looks like this:
	//
	// UI event -> url -> URL event -> DOM
	//
	// You will see in the rest of the code that we always update the URL only, instead of directly manipulating the DOM.

	page = Number(new URLSearchParams(location.search).get('page') || 1)
	getColors().then(() => {
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

function updateTable() {
	let startIndex = (page - 1) * perPage
	let endIndex = startIndex + perPage
	let pageData = data.slice(startIndex, endIndex)

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