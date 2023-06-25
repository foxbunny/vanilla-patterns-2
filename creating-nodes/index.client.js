requestIdleCallback(start)

function start() {
	$trigger.addEventListener('click', generateNumber)
}

let $list = document.getElementById('random-numbers')
let $trigger = document.getElementById('generate-number')

// We pre-clone the template rather than clone it as needed. We will later clone the pre-cloned template again. Cloning
// a concrete DOM node is faster than cloning a document fragment. (See https://jsbench.me/q0ljakraoe/1)
//
// It's not a big difference performance-wise (10~30%), but since there's not a lot of effort involved in cloning the
// pre-cloned template, maximizing the performance is relatively cheap. Therefore, we just go for it.
//
// For this to work, the template must only contain one direct child node. This is usually exactly what we want because
// manging templates with multiple children is not worth the trouble in the context of list rendering.
let $template = document.getElementById('list-item').content.cloneNode(true).firstElementChild

function generateNumber() {
	let n = Math.round(Math.random() * 999 + 1)
	let t = new Date()
	let $item = $template.cloneNode(true)

	// The template is populated by selecting relevant parts of the subtree and manipulating the nodes.
	$item.querySelector('span:first-child').textContent = n
	$item.querySelector('span:last-child').textContent = t.toLocaleTimeString(navigator.language)
	$list.append($item)
}