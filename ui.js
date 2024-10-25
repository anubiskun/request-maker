/**
 * Copyright (c) 2011, 2012 Juho Nurminen
 *
 * This software is provided 'as-is', without any express or implied
 * warranty. In no event will the authors be held liable for any damages
 * arising from the use of this software.
 *
 * Permission is granted to anyone to use this software for any purpose,
 * including commercial applications, and to alter it and redistribute it
 * freely, subject to the following restrictions:
 *
 *    1. The origin of this software must not be misrepresented; you must not
 *    claim that you wrote the original software. If you use this software
 *    in a product, an acknowledgment in the product documentation would be
 *    appreciated but is not required.
 *
 *    2. Altered source versions must be plainly marked as such, and must not be
 *    misrepresented as being the original software.
 *
 *    3. This notice may not be removed or altered from any source
 *    distribution.
 */

var ui;

(function () {

	var widgets = [],
		onReadyFunctions = [],

		filter = function (array, filter) {
			var i, result = [];
			for (i = 0; i < array.length; i++) {
				if (filter(array[i], i)) {
					result.push(array[i]);
				}
			}
			return result;
		},

		widgetify = function (element) {
			var widget;

			widget = filter(widgets, function (widget) {
				if (widget.__proto__.isSameNode(element)) {
					return true;
				} else {
					return false;
				}
			})[0];

			if (typeof widget == 'undefined') {
				widget = new Widget(element);
				widgets.push(widget);
			}

			return widget;
		},

		sortChildren = function () {
			var i, children = filter(this.childNodes, function (node) {
				return node.nodeType == 1 ? true : false;
			});

			for (i = 0; i < arguments.length; i++) {
				this.appendChild(children[arguments[i]]);
			}
		},

		Widget = function (element) {
			this.__proto__ = element;

			this.getWidgets = function (name) {
				var i, widgets = [],

					elements = filter(this.__proto__.getElementsByTagName('*'), function (element) {
						return element.dataset['widget'] == name || (name == '*' && element.dataset['widget']) ? true : false;
					});

				for (i = 0; i < elements.length; i++) {
					widgets.push(widgetify(elements[i]));
				}

				return widgets;
			};

			if (!(this instanceof HTMLElement)) {
				return;
			}

			this.flags = (this.__proto__.dataset['flags'] || '') && this.__proto__.dataset['flags'].split(' ');

			// set widget type
			switch (this.__proto__.dataset['widget']) {
				case 'notebook':
					Notebook.apply(this);
					break;
				case 'table':
					Table.apply(this);
					break;
				case 'sourceviewer':
					SourceViewer.apply(this);
					break;
				case 'split':
					Split.apply(this);
					break;
			}
		},

		Notebook = function () {
			var i, that = this;

			this.tabs = filter(this.__proto__.childNodes, function (node) {
				return node.nodeType == 1 ? true : false;
			});

			this.nav = widgetify(document.createElement('nav'));

			this.__proto__.insertBefore(this.nav.__proto__, this.__proto__.firstChild);

			for (i = 0; i < this.tabs.length; i++) {
				this.tabs[i] = widgetify(this.tabs[i]);

				this.tabs[i].button = widgetify(document.createElement('button'));
				this.tabs[i].button.__proto__.setAttribute('type', 'button');
				this.tabs[i].button.__proto__.innerText = this.tabs[i].__proto__.dataset['title'];
				if (filter(this.tabs[i].flags, function (flag) { return flag.toUpperCase() == 'DISABLED' }).length) {
					this.tabs[i].button.__proto__.setAttribute('disabled', 'disabled');
				}

				this.nav.__proto__.appendChild(this.tabs[i].button.__proto__);

				this.tabs[i].button.__proto__.addEventListener('click', (function (i) {
					return function () {
						var j;

						for (j = 0; j < that.tabs.length; j++) {
							if (j == i) {
								that.tabs[j].__proto__.style.display = 'block';
								that.tabs[j].button.__proto__.dataset['selected'] = 'yes';
							} else {
								if (j !== 0) {
									that.tabs[j].__proto__.style.display = 'none';
								}
								that.tabs[j].button.__proto__.dataset['selected'] = 'no';
							}
						}
					}
				})(i));
			}

			this.tabs[0].button.__proto__.click();

			this.showTab = function (i) {
				this.tabs[i].button.__proto__.click();
			};

			this.enableTab = function (i) {
				this.tabs[i].flags = filter(this.tabs[i].flags, function (flag) { return flag.toLowerCase() != 'disabled' });
				this.tabs[i].__proto__.dataset['flags'] = this.tabs[i].flags.join(' ');
				this.tabs[i].button.__proto__.removeAttribute('disabled');
			};

			this.disableTab = function (i) {
				if (filter(this.tabs[i].flags, function (flag) { return flag.toLowerCase() == 'disabled' }).length) {
					return; // already disabled
				}
				this.tabs[i].flags.push('disabled');
				this.tabs[i].__proto__.dataset['flags'] = this.tabs[i].flags.join(' ');
				this.tabs[i].button.__proto__.setAttribute('disabled', 'disabled');
			};
		},

		Table = function () {
			var i, headers, data, adjustHeaders, that = this;

			this.head = filter(this.__proto__.childNodes, function (node) {
				return node.dataset && node.dataset['widget'] == 'table-head' ? true : false;
			})[0];
			if (typeof this.head == 'undefined') {
				return;
			}
			headers = filter(this.head.childNodes, function (node) {
				return node.nodeType == 1 ? true : false;
			});
			this.body = filter(this.__proto__.childNodes, function (node) {
				return node.dataset && node.dataset['widget'] == 'table-body' ? true : false;
			})[0];
			if (typeof this.body == 'undefined') {
				return;
			}

			for (i = 0; i < headers.length; i++) {
				headers[i].addEventListener('click', (function (column) {
					return function () {
						var i, cells, order = [], sorter = [], rows = filter(that.body.childNodes, function (node) {
							return node.nodeType == 1 ? true : false;
						});

						for (i = 0; i < headers.length; i++) {
							headers[i].dataset['sort'] = 'none';
						};

						for (i = 0; i < rows.length; i++) {
							cells = filter(rows[i].childNodes, function (node) {
								return node.nodeType == 1 ? true : false;
							});

							sorter.push([cells[column].innerText, i]);
						}

						if (sorter.toString() == sorter.sort().toString()) {
							sorter.reverse();
							headers[column].dataset['sort'] = 'desc';
						} else {
							headers[column].dataset['sort'] = 'asc';
						}

						for (i = 0; i < sorter.length; i++) {
							sorter[i] = sorter[i][1];
						}

						sortChildren.apply(that.body, sorter);

					}
				})(i));
			}
		},

		Split = function () {
			var first, second, handle, dragging = false;

			first = filter(this.__proto__.childNodes, function (node) {
				return node.nodeType == 1;
			});
			second = first[1];
			first = first[0];

			first.style.height = '50%';
			second.style.height = '50%';

			handle = document.createElement('div');
			this.__proto__.insertBefore(handle, second);
			handle.addEventListener('mousedown', function (event) {
				dragging = true;
			});
			window.addEventListener('mousemove', function (event) {
				var h, element;

				if (dragging) {
					h = event.clientY;
					element = first;
					while (element.offsetParent) {
						h -= element.offsetTop;
						element = element.offsetParent;
					}

					h = 100 * (h / first.parentNode.clientHeight);

					if (h < 0) {
						h = 0;
					} else if (h > 100) {
						h = 100;
					}

					first.style.height = h + '%';
					second.style.height = 100 - h + '%';
				}
			}, true);
			window.addEventListener('mouseup', function (event) {
				dragging = false;
			}, true);
		};

	ui = function (w) {
		if (w instanceof HTMLElement) {
			return widgetify(w);
		} else {
			return widgetify(document.getElementById(w));
		}
	};

	ui.onReady = function (f) {
		onReadyFunctions.push(f);
	};

	window.addEventListener('DOMContentLoaded', function () {
		var i;

		widgetify(document).getWidgets('*');
		for (i = 0; i < onReadyFunctions.length; i++) {
			onReadyFunctions[i]();
		}
	});

})();
