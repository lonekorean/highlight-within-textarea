(function($) {
	var PREFIX = 'hwt';

	var InputTextHighlighter = function($el, options) {
		this.$el = $el;
		this.options = $.extend({}, this.defaultOptions, options);
		this.counter = InputTextHighlighter.prototype.sharedCounter++;

		this.generate();
	};

	InputTextHighlighter.prototype = {
		sharedCounter: 0,

		defaultOptions: {
			onInput: function(text) { return text; }
		},

		generate: function() {
			this.$wrapper = $('<div>', { class: PREFIX + '-wrapper' });
			this.$backdrop = $('<div>', { class: PREFIX + '-backdrop' });
			this.$content = $('<div>', {
				class: PREFIX + '-content ' + PREFIX + '-text'
			});

			this.$el
				.addClass(PREFIX + '-input ' + PREFIX + '-text')
				.wrap(this.$wrapper)
				.before(this.$backdrop.append(this.$content));

			// I hate browser specific sniffing/hacks as much as the
			// next guy, but there are quirks to iron out that are not
			// a matter of feature detection.
			this.fixFirefox();
			this.fixIOS();

			this.eventNamespace = '.' + PREFIX + '_' + this.counter;
			this.$el.on({
				'input': this.handleInput.bind(this),
				'scroll': this.handleScroll.bind(this)
			});

			this.handleInput(this.$el[0]);
		},

		fixFirefox: function() {
			// detect
			var isFirefox = window.navigator.userAgent.toLowerCase().indexOf('firefox') !== -1;

			// Firefox hides text that is scrolled into the padding of a textarea,
			// unlike other browsers. This can cause wacky looking empty highlights
			// while scrolling. This shifts some pixels around so that highlights
			// match the behavior of the text in not being visible in the padding.
			if (isFirefox) {
				// get padding/border pixels
				var padding = this.$content.css([
					'padding-top', 'padding-right', 'padding-bottom', 'padding-left'
				]);
				var border = this.$content.css([
					'border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width'
				]);

				this.$backdrop
					.css({
						// add padding pixels
						'margin-top': '+=' + padding['padding-top'],
						'margin-right': '+=' + padding['padding-right'],
						'margin-bottom': '+=' + padding['padding-bottom'],
						'margin-left': '+=' + padding['padding-left'],
					})
					.css({
						// add border pixels
						'margin-top': '+=' + border['border-top-width'],
						'margin-right': '+=' + border['border-right-width'],
						'margin-bottom': '+=' + border['border-bottom-width'],
						'margin-left': '+=' + border['border-left-width'],
					});

				// remove original padding/border pixels
				this.$content.css({
					'padding': '0',
					'border': 'none'
				});
			}
		},

		fixIOS: function() {
			// detect (windows phone flags itself as "like iPhone", thus the extra check)
			var ua = window.navigator.userAgent.toLowerCase();
			var isIOS = !!ua.match(/ipad|iphone|ipod/);
			var isWinPhone = ua.indexOf('windows phone') !== -1;

			// iOS adds 3px of (unremovable) padding to the left and right of a
			// textarea, so adjust $content to match
			if (isIOS && !isWinPhone) {
				this.$content.css({
					'padding-left': '+=3px',
					'padding-right': '+=3px'
				});
			}
		},

		getType: function(instance) {
			return Object.prototype.toString.call(instance)
				.replace('[object ', '')
				.replace(']', '')
				.toLowerCase();
		},

		handleInput: function() {
			var content = this.$el.val()
			var payload = this.options.onInput(content);
			switch (this.getType(payload)) {
				case 'string':
					content = this.markString(content, payload);
					break;
				case 'regexp':
					content = this.markRegExp(content, payload);
					break;
				case 'array':
					content = this.markArray(content, payload);
					break;
				default:
					throw 'Unrecognized payload type returned from onInput callback.';
			}

			content = content.replace(/\n$/, '\n\n');
			this.$content.html(content);
		},

		handleScroll: function() {
			var scrollTop = this.$el.scrollTop();
			this.$backdrop.scrollTop(scrollTop);
		},

		markString: function(content, payload) {
			var stripped = payload.replace(/<\/?mark>/gi, '');
			if (stripped !== content) {
				throw 'Unallowed changes in string returned from onInput callback.';
			}
			return payload;
		},

		markRegExp: function(content, payload) {
			return content.replace(payload, '<mark>$&</mark>');
		},

		markArray: function(content, payload) {
			var offset = 0;
			payload.forEach(function(element) {
				var open = element[0] + offset;
				content = content.slice(0, open) + '<mark>' + content.slice(open);
				offset += 6;
				var close = element[1] + offset;
				content = content.slice(0, close) + '</mark>' + content.slice(close);
				offset += 7;
			}, this);
			return content;
		},

		destroy: function() {
			this.$backdrop.remove();
			this.$el
				.unwrap()
				.removeClass(PREFIX + '-input')
				.off(this.eventNamespace)
				.removeData(PREFIX);
		},
	};

	// the actual jQuery plugin
	$.fn.inputTextHighlighter = function(options) {
		return this.each(function() {
			var $this = $(this);
			var inputTextHighlighter = $this.data(PREFIX);
			if (inputTextHighlighter) {
				inputTextHighlighter.destroy();
			}

			inputTextHighlighter = new InputTextHighlighter($this, options);
			$this.data(PREFIX, inputTextHighlighter);
		});
	};
})(jQuery);
