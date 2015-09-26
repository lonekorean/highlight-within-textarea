# highlight-within-textarea
jQuery plugin for highlighting bits of text within a textarea.

### Introduction

It's not actually possible to style text in a textarea, because any markup within a textarea is treated as plain text. This plugin aims to fake it, allowing you to highlight pieces of text inside a textarea.

A native textarea element is used and familiar properties (auto-correct, scrolling, resizing, etc.) work as expected.

### Usage

To see examples in action, check out [the demo page](http://lonekorean.github.io/highlight-within-textarea/).

Make sure you reference both the CSS and the JS files on your page. Then you can use the plugin like this:

```javascript
function onInput(input) {
	// do stuff, return something
}

$('.my-textarea').highlightWithinTextarea(onInput);
```
The plugin takes a callback function that is called every time the textarea's input changes. Its job is to indicate which bits of text should be highlighted. There are a couple ways to do this, depending on the type of what is returned, as outlined below.

##### Regex

If a RegExp object is returned, then any text matching the pattern will be highlighted.

Example:

```javascript
function onInput(input) {
	return /\w+/g;
}
```

##### Array

The function may also return an array of arrays. Each inner array specifies a span of highlighting and should have exactly 2 values: the starting character index (inclusive) and the ending character index (exclusive).

Example:

```javascript
function onInput(input) {
	return [[0, 5], [10, 15]];
}
```

##### Something Falsey

Returning any falsey value (`false`, `undefined`, `null`, `0`, `''`, or `NaN`) will highlight nothing.

Example:

```javascript
function onInput(input) {
	return false;
}
```

### Styling

For reference, [the demo page](http://lonekorean.github.io/highlight-within-textarea/) has some sample styling.

There are a few guidelines for getting your styles in the right places. Here are the classes you'll want to use.

##### .hwt-container

Use for background, positioning, and visibility (`display`, `margin`, `position`, `top`, `left`, `background`, etc.).

##### .hwt-content

Use for sizing and text formatting (`width`, `height`, `padding`, `border`, `color`, `font`, etc.).

##### .hwt-content mark

Use for highlighted text. Generally, stuff that doesn't change size is fine (`background-color`, `border-radius`, `box-shadow`, etc.). Changes to `color` won't be visible, since text in the textarea covers colored text in the highlights.

### Destroying

You can remove the plugin from a textarea with this:

```javascript
$('.my-textarea').data('hwt').destroy();
```
