/*
 * highlight-within-textarea v1.0.2
 *
 * @author  Will Boyd
 * @github  https://github.com/lonekorean/highlight-within-textarea
 */

(function($) {
	var ID = 'hwt';
	var OPEN_MARK = '--##HWT:OPEN##--';
	var CLOSE_MARK = '--##HWT:CLOSE##--';

	var HighlightWithinTextarea = function($el, onInput) {
		this.$el = $el;
		this.onInput = onInput || this.onInput;
		this.generate();
	};

	HighlightWithinTextarea.prototype = {
		onInput: function(text) {
			throw 'onInput callback not provided.'
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

			// pre-fire this event to highlight any existing input
			this.handleInput(this.$el[0]);
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

		getType: function(instance) {
			return Object.prototype.toString.call(instance)
				.replace('[object ', '')
				.replace(']', '')
				.toLowerCase();
		},

		handleInput: function() {
			var input = this.$el.val()
			var payload = this.onInput(input);
			if (payload) {
				switch (this.getType(payload)) {
					case 'array':
						input = this.markArray(input, payload);
						break;
					case 'regexp':
						input = this.markRegExp(input, payload);
						break;
					default:
						throw 'Unrecognized payload type returned from onInput callback.';
				}
			}

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
