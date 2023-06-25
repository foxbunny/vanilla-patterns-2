requestIdleCallback(start)

function start() {
	getColors(updateTable)
	$trigger.addEventListener('click', () => getColors(updateTable))
}

let $table = document.getElementById('colors')
let $tbody = $table.querySelector('tbody')
let $trigger = document.getElementById('load-more')

let perPage = 20
let maxPage = 5 // we only have 100 records in total
let page = 0
let data = []
let loading = Promise.resolve()

function getColors(onFinish) {
	if (page == maxPage) return
	// Technically, it's possible that getColors() gets called multiple times. In such a case, we want the next request to
	// wait for the previous one to finish. Each time the function is called, we chain on the `loading` promise, and then
	// assign the chain to the `loading` variable. This effectively continues the chain every time we call getColors(),
	// and new requests are always performed when the previous one finishes.
	loading = loading.then(() =>
		fetch('https://6497760983d4c69925a3aaa7.mockapi.io/colors')
			.then(res => res.json())
			.then(json => {
				page++
				// The actual response is not really paginated, so we simulate pagination using .slice().
				data = json.slice(0, page * perPage)
				// Rather than returning the promise from getColors() and chaining on it, we use a callback for continuation.
				// This allows us to control whether continuation happens at all (by returning early in the first line of this
				// function).
				onFinish()
			})
			.catch(() => {
				alert('There was an error fetching the data.')
			})
	)
}

function updateTable() {
	data.forEach((rowData, index) => {
		// 1. we try to find a matching row
		let $row = $tbody.children[index]

		// 2. if the row does not exist, we create it by cloning the first row. We simultaneously clear the `id`
		if (!$row) {
			$row = $tbody.children[0].cloneNode(true)
			$row.id = ''
			$tbody.append($row)
		}

		// 3. In our case, the row data does not change, so we only check if the id matches. If it does, then we skip the
		// update.
		if ($row.id == rowId(rowData)) return

		// 4. We update the row with the data. We also assign it an id so that it can be found later when we are checking
		// for existing rows.
		$row.id = rowId(rowData)
		$row.querySelector('td:first-child').textContent = rowData.id
		$row.querySelector('td:nth-child(2)').textContent = rowData.color
		$row.querySelector('td:last-child').textContent = rowData.count

		// 5. Remove the `hidden` attribute.
		$row.hidden = false
	})
}

function rowId(rowData) {
	// Single source of truth for how row id is created
	return 'color-' + rowData.id
}
