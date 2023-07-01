// We handle two things in JavaScript, both non-essential.
//
// Firstly, we add a small cosmetic improvement to the UX by moving the focused photo into the center of the carousel
// when using keyboard navigation to tab within the photo list.
//
// Secondly, we replace the scrollbar with dots for indicating the portion of the list that's currently visible and
// allow the user to jump to different parts of the list.
//
// This code is entirely independent of the CSS, and makes no assumptions about the number of images shown in the
// carousel (which could be 1, 2 or 3).

requestIdleCallback(start)

function start() {
	$photoList.addEventListener('focusin', ev => {
		if (ev.target.matches('a')) scrollIntoView(ev.target.parentElement)
	})
	createDotIndicators()
	$dotIndicators.hidden = false
	$photoList.dataset.active = 'true'
}

let $photoList = document.getElementById('photo-list')
let $dotIndicators = document.getElementById('dot-indicators')
let itemVisibilityObserver = new IntersectionObserver(entries => {
	// We observe the intersection between the visible area of the photo list and the individual list items under it. As
	// the user scrolls, the visibility of each observed item changes, we update the corresponding dot's data-visible
	// attribute. The dots are styled in CSS based on this attribute.
	for (let {target, isIntersecting} of entries)
		target.$dot.dataset.visible = isIntersecting
}, {
	root: $photoList,
	threshold: 0.5,
})

function createDotIndicators() {
	for (let $ of $photoList.children) {
		// Create and the cache the dot indicator element for later use in the intersection observer. Since the dot indicator
		// is not intended to be accessible (no need as thumbnails can be tabbed to using the keyboard) we use a span instead
		// of a <button> or <a>, and it only supports clicks.
		let $dot = $.$dot = document.createElement('span')
		$dot.addEventListener('click', () => {
			scrollIntoView($)
			$.firstElementChild.focus()
		})
		$dotIndicators.append($dot)
		// Observe this item for intersection changes
		itemVisibilityObserver.observe($)
	}
}

// Center the focused element inside the carousel. Since scroll-snap is enabled, it is not necessary to account for
// elements that can't be scrolled to the specified position.
function scrollIntoView($li) {
	let targetOffset = $li.offsetLeft - $photoList.offsetLeft - ($photoList.offsetWidth - $li.offsetWidth) / 2
	return $photoList.scroll(targetOffset, 0)
}