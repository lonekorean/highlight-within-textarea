/*
 * highlight-within-textarea
 *
 * @author  Will Boyd
 * @github  https://github.com/lonekorean/highlight-within-textarea
 */

(function($) {
	var ID = 'hwt';
	var NAME = 'highlight-within-textarea';
	var OPEN_MARK = '--##HWT:OPEN##--';
	var CLOSE_MARK = '--##HWT:CLOSE##--';

	var HighlightWithinTextarea = function($el, config) {
		this.init($el, config);
	};

	HighlightWithinTextarea.prototype = {
		init: function($el, config) {
			this.$el = $el;

			if (config === undefined) {
				throw NAME + ': config object not provided.';
			}

			// for backwards compatibility with v1
			if (this.getType(config) === 'function') {
				config = { highlight: config };
			}

			if (this.getType(config.hightlight) === 'array') {
				this.hightlight = config.highlight;
			} else {
				// convert to single item array
				this.highlight = [config.highlight];
			}

			this.generate();
		},

		getType: function(instance) {
			var type = typeof instance;
			if (!instance) {
				return 'falsey';
			} else if (Array.isArray(instance)) {
				if (instance.length === 2 && typeof instance[0] === 'number' && typeof instance[1] === 'number') {
					return 'range';
				} else {
					return 'array';
				}
			} else if (type === 'object') {
				if (instance instanceof RegExp) {
					return 'regexp';
				} else if (instance.hasOwnProperty('highlight')) {
					return 'highlight';
				}
			} else if (type === 'function' || type === 'string') {
				return type;
			}

			return 'other';
		},

		generate: function() {
			this.$el
				.addClass(ID + '-input ' + ID + '-content')
				.on('input.' + ID, this.handleInput.bind(this))
				.on('scroll.' + ID, this.handleScroll.bind(this));

			this.$highlights = $('<div>', { class: ID + '-highlights ' + ID + '-content' });

			this.$backdrop = $('<div>', { class: ID + '-backdrop' })
				.append(this.$highlights);

			this.$container = $('<div>', { class: ID + '-container' })
				.insertAfter(this.$el)
				.append(this.$backdrop, this.$el) // moves $el into $container
				.on('scroll', this.blockContainerScroll.bind(this));

			this.browser = this.detectBrowser();
			switch (this.browser) {
				case 'firefox':
					this.fixFirefox();
					break;
				case 'ios':
					this.fixIOS();
					break;
			}

			// trigger input event to highlight any existing input
			this.handleInput();
		},

		// yeah, browser sniffing sucks, but there are browser-specific quirks
		// to handle that are not a matter of feature detection
		detectBrowser: function() {
			var ua = window.navigator.userAgent.toLowerCase();
			if (ua.indexOf('firefox') !== -1) {
				return 'firefox';
			} else if (!!ua.match(/msie|trident\/7|edge/)) {
				return 'ie';
			} else if (!!ua.match(/ipad|iphone|ipod/) && ua.indexOf('windows phone') === -1) {
				// Windows Phone flags itself as "like iPhone", thus the extra check
				return 'ios';
			} else {
				return 'other';
			}
		},

		// Firefox doesn't show text that scrolls into the padding of a
		// textarea, so rearrange a couple box models to make highlights
		// behave the same way
		fixFirefox: function() {
			// take padding and border pixels from highlights div
			var padding = this.$highlights.css([
				'padding-top', 'padding-right', 'padding-bottom', 'padding-left'
			]);
			var border = this.$highlights.css([
				'border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width'
			]);
			this.$highlights.css({
				'padding': '0',
				'border-width': '0'
			});

			this.$backdrop
				.css({
					// give padding pixels to backdrop div
					'margin-top': '+=' + padding['padding-top'],
					'margin-right': '+=' + padding['padding-right'],
					'margin-bottom': '+=' + padding['padding-bottom'],
					'margin-left': '+=' + padding['padding-left'],
				})
				.css({
					// give border pixels to backdrop div
					'margin-top': '+=' + border['border-top-width'],
					'margin-right': '+=' + border['border-right-width'],
					'margin-bottom': '+=' + border['border-bottom-width'],
					'margin-left': '+=' + border['border-left-width'],
				});
		},

		// iOS adds 3px of (unremovable) padding to the left and right of a
		// textarea, so adjust highlights div to match
		fixIOS: function() {
			this.$highlights.css({
				'padding-left': '+=3px',
				'padding-right': '+=3px'
			});
		},

		handleInput: function() {
			var input = this.$el.val();
			var ranges = this.getRanges(input, this.highlight);
			var boundaries = this.getBoundaries(ranges);

			this.renderMarks(boundaries);
/*
			// this keeps scrolling aligned when input ends with a newline
			input = input.replace(new RegExp('\\n(' + CLOSE_MARK + ')?$'), '\n\n$1');

			// escape HTML
			input = input.replace(/&/g, '&amp;')
					.replace(/</g, '&lt;')
					.replace(/>/g, '&gt;');

			// replace tokens with actual mark tags
			input = input.replace(new RegExp(OPEN_MARK, 'g'), '<mark>');
			input = input.replace(new RegExp(CLOSE_MARK, 'g'), '</mark>');

			if (this.browser === 'ie') {
				// IE wraps whitespace differently in a div vs textarea, this fixes it
				input = input.replace(/ /g, ' <wbr>');
			}

			this.$highlights.html(input);
*/
		},

		getBoundaries: function(ranges) {
			var boundaries = [];
			ranges.forEach(function(range) {
				boundaries.push({
					type: 'start',
					index: range[0]
				});
				boundaries.push({
					type: 'stop',
					index: range[1]
				});
			});

			this.sortBoundaries(boundaries);
			return boundaries;
		},

		sortBoundaries: function(boundaries) {
			// backwards sort (since marks are inserted right to left)
			boundaries.sort(function(a, b) {
				if (a.index !== b.index) {
					return b.index - a.index;
				} else if (a.type === 'stop') {
					return 1;
				} else {
					return 0;
				}
			});
		},

		renderMarks: function(boundaries) {
			var input = this.$el.val();
			boundaries.forEach(function(boundary) {
				var markup = boundary.type === 'start' ? '<mark>' : '</mark>';
				input = input.slice(0, boundary.index) + markup + input.slice(boundary.index);
			});
			this.$highlights.html(input);
		},

		getRanges: function(input, highlight) {
			var type = this.getType(highlight);
			switch (type) {
				case 'array':
					return this.getArrayRanges(input, highlight);
				case 'function':
					return this.getFunctionRanges(input, highlight);
				case 'regexp':
					return this.getRegExpRanges(input, highlight);
				case 'string':
					return this.getStringRanges(input, highlight);
				case 'range':
					return this.getRangeRanges(input, highlight);
				default:
					if (!highlight) {
						return [];
					} else {
						throw 'Unrecognized highlight type: ' + type;
					}
			}
		},

		getArrayRanges: function(input, array) {
			var ranges = array.map(this.getRanges.bind(this, input));
			return Array.prototype.concat.apply([], ranges);

		},

		getFunctionRanges: function(input, func) {
			return this.getRanges(input, func(input));
		},

		getRangeRanges: function(input, range) {
			return [range];
		},

		handleScroll: function() {
			var scrollTop = this.$el.scrollTop();
			this.$backdrop.scrollTop(scrollTop);

			// Chrome and Safari won't break long strings of spaces, which can cause
			// horizontal scrolling, this compensates by shifting highlights by the
			// horizontally scrolled amount to keep things aligned
			var scrollLeft = this.$el.scrollLeft();
			this.$backdrop.css('transform', (scrollLeft > 0) ? 'translateX(' + -scrollLeft + 'px)' : '');
		},

		// in Chrome, page up/down in the textarea will shift stuff within the
		// container (despite the CSS), this immediately reverts the shift
		blockContainerScroll: function(e) {
			this.$container.scrollLeft(0);
		},

		markArray: function(input, payload) {
			var offset = 0;
			payload.forEach(function(element) {
				// insert open tag
				var open = element[0] + offset;
				input = input.slice(0, open) + OPEN_MARK + input.slice(open);
				offset += OPEN_MARK.length;

				// insert close tag
				var close = element[1] + offset;
				input = input.slice(0, close) + CLOSE_MARK + input.slice(close);
				offset += CLOSE_MARK.length;
			}, this);
			return input;
		},

		markRegExp: function(input, payload) {
			return input.replace(payload, OPEN_MARK + '$&' + CLOSE_MARK);
		},

		destroy: function() {
			this.$backdrop.remove();
			this.$el
				.unwrap()
				.removeClass(ID + '-text ' + ID + '-input')
				.off(ID)
				.removeData(ID);
		},
	};

	// register the jQuery plugin
	$.fn.highlightWithinTextarea = function(onInput) {
		return this.each(function() {
			var $this = $(this);

			var highlightWithinTextarea = $this.data(ID);
			if (highlightWithinTextarea) {
				highlightWithinTextarea.destroy();
			}

			highlightWithinTextarea = new HighlightWithinTextarea($this, onInput);
			$this.data(ID, highlightWithinTextarea);
		});
	};
})(jQuery);
