# highlight-within-textarea
jQuery plugin for highlighting bits of text within a textarea.

### Introduction

It's not actually possible to style text in a textarea, because any markup within a textarea is treated as plain text. This plugin aims to fake it, allowing you to highlight pieces of text inside a textarea.

A native textarea element is used and familiar properties (auto correct, resizability, etc.) work as expected.

### Usage

To see examples in action, check out [demo.html](https://github.com/lonekorean/highlight-within-textarea/blob/master/demo.html).

Make sure you reference both the CSS and the JS files on your page. Then you can attach the plugin to your existing textareas:

```javascript
$('.my-textarea').highlightWithinTextarea({ onInput: onInputHandler });
```
The plugin takes a config object with a single property called `onInput`, which is a callback function that determines what text to highlight. This function can return different types, as outlined below.

##### Regex

If a RegExp object is returned, then any text matching the pattern will be highlighted.

Example:

```javascript
function onInputHandler(input) {
	return /\w+/g;
}
```

##### Array

The function may also return an array of arrays. Each inner array specifies a span of highlighting and should have exactly 2 values: the starting character index (inclusive) and the ending character index (exclusive).

Example:

```javascript
function onInputHandler(input) {
	return [[0, 5], [10, 15]];
}
```

##### Something Falsey

Returning any falsey value (`false`, `undefined`, `null`, `0`, `''`, or `NaN`) will highlight nothing.

Example:

```javascript
function onInputHandler(input) {
	return false;
}
```

### Styling

For reference, [demo.html](https://github.com/lonekorean/highlight-within-textarea/blob/master/demo.html) has some sample styling.

There are a few guidelines for getting your styles in the right places. Here are the classes you'll want to use.

##### .hwt-container

Use for background, positioning, and visibility (`display`, `margin`, `position`, `top`, `left`, `background`, etc.).

##### .hwt-content

Use for sizing and text formatting (`width`, `height`, `padding`, `border`, `color`, `font`, etc.).

##### .hwt-content mark

Use for highlighted text. Generally, stuff that doesn't change size is fine (`background-color`, `border-radius`, `box-shadow`, etc.). Changes to `color` won't be visible, since text in the textarea covers colored text in the highlights.
