(function () {
  var $$dbClassInfo = {
    "dependsOn": {
      "qx.core.Environment": {
        "defer": "load",
        "construct": true,
        "require": true
      },
      "qx.Class": {
        "usage": "dynamic",
        "require": true
      },
      "qx.ui.core.Widget": {
        "construct": true,
        "require": true
      },
      "qx.ui.form.IStringForm": {
        "require": true
      },
      "qx.ui.form.IForm": {
        "require": true
      },
      "qx.ui.form.MForm": {
        "require": true
      },
      "qx.bom.client.Engine": {},
      "qx.bom.client.Browser": {},
      "qx.theme.manager.Color": {},
      "qx.ui.style.Stylesheet": {
        "defer": "runtime"
      },
      "qx.bom.client.Css": {
        "construct": true
      },
      "qx.locale.Manager": {
        "construct": true,
        "defer": "runtime"
      },
      "qx.html.Input": {},
      "qx.util.ResourceManager": {},
      "qx.theme.manager.Font": {},
      "qx.bom.webfonts.WebFont": {},
      "qx.bom.Font": {},
      "qx.html.Element": {},
      "qx.bom.Label": {},
      "qx.ui.core.queue.Layout": {},
      "qx.lang.Type": {},
      "qx.event.type.Data": {},
      "qx.html.Label": {},
      "qx.bom.Stylesheet": {}
    },
    "environment": {
      "provided": [],
      "required": {
        "engine.name": {
          "className": "qx.bom.client.Engine"
        },
        "browser.name": {
          "className": "qx.bom.client.Browser"
        },
        "engine.version": {
          "className": "qx.bom.client.Engine"
        },
        "css.placeholder": {
          "construct": true,
          "className": "qx.bom.client.Css"
        },
        "browser.documentmode": {
          "className": "qx.bom.client.Browser"
        },
        "browser.version": {
          "className": "qx.bom.client.Browser"
        }
      }
    }
  };
  qx.Bootstrap.executePendingDefers($$dbClassInfo);

  /* ************************************************************************
  
     qooxdoo - the new era of web development
  
     http://qooxdoo.org
  
     Copyright:
       2004-2008 1&1 Internet AG, Germany, http://www.1und1.de
  
     License:
       MIT: https://opensource.org/licenses/MIT
       See the LICENSE file in the project's top-level directory for details.
  
     Authors:
       * Sebastian Werner (wpbasti)
       * Andreas Ecker (ecker)
       * Fabian Jakobs (fjakobs)
  
  ************************************************************************ */

  /**
   * This is a basic form field with common functionality for
   * {@link TextArea} and {@link TextField}.
   *
   * On every keystroke the value is synchronized with the
   * value of the textfield. Value changes can be monitored by listening to the
   * {@link #input} or {@link #changeValue} events, respectively.
   */
  qx.Class.define("qx.ui.form.AbstractField", {
    extend: qx.ui.core.Widget,
    implement: [qx.ui.form.IStringForm, qx.ui.form.IForm],
    include: [qx.ui.form.MForm],
    type: "abstract",
    statics: {
      /** Stylesheet needed to style the native placeholder element. */
      __P_164_0: null,

      /**
       * Adds the CSS rules needed to style the native placeholder element.
       */
      __P_164_1: function __P_164_1() {
        var engine = qx.core.Environment.get("engine.name");
        var browser = qx.core.Environment.get("browser.name");
        var colorManager = qx.theme.manager.Color.getInstance();
        var color = colorManager.resolve("text-placeholder");
        var selector;

        if (engine == "gecko") {
          // see https://developer.mozilla.org/de/docs/CSS/:-moz-placeholder for details
          if (parseFloat(qx.core.Environment.get("engine.version")) >= 19) {
            selector = "input::-moz-placeholder, textarea::-moz-placeholder";
          } else {
            selector = "input:-moz-placeholder, textarea:-moz-placeholder";
          }

          qx.ui.style.Stylesheet.getInstance().addRule(selector, "color: " + color + " !important");
        } else if (engine == "webkit" && browser != "edge") {
          selector = "input.qx-placeholder-color::-webkit-input-placeholder, textarea.qx-placeholder-color::-webkit-input-placeholder";
          qx.ui.style.Stylesheet.getInstance().addRule(selector, "color: " + color);
        } else if (engine == "mshtml" || browser == "edge") {
          var separator = browser == "edge" ? "::" : ":";
          selector = ["input.qx-placeholder-color", "-ms-input-placeholder, textarea.qx-placeholder-color", "-ms-input-placeholder"].join(separator);
          qx.ui.style.Stylesheet.getInstance().addRule(selector, "color: " + color + " !important");
        }
      }
    },

    /*
    *****************************************************************************
       CONSTRUCTOR
    *****************************************************************************
    */

    /**
     * @param value {String} initial text value of the input field ({@link #setValue}).
     */
    construct: function construct(value) {
      qx.ui.core.Widget.constructor.call(this); // shortcut for placeholder feature detection

      this.__P_164_2 = !qx.core.Environment.get("css.placeholder");

      if (value != null) {
        this.setValue(value);
      }

      this.getContentElement().addListener("change", this._onChangeContent, this); // use qooxdoo placeholder if no native placeholder is supported

      if (this.__P_164_2) {
        // assign the placeholder text after the appearance has been applied
        this.addListener("syncAppearance", this._syncPlaceholder, this);
      } else {
        // add rules for native placeholder color
        qx.ui.form.AbstractField.__P_164_1(); // add a class to the input to restrict the placeholder color


        this.getContentElement().addClass("qx-placeholder-color");
      } // translation support


      {
        qx.locale.Manager.getInstance().addListener("changeLocale", this._onChangeLocale, this);
      }
    },

    /*
    *****************************************************************************
       EVENTS
    *****************************************************************************
    */
    events: {
      /**
       * The event is fired on every keystroke modifying the value of the field.
       *
       * The method {@link qx.event.type.Data#getData} returns the
       * current value of the text field.
       */
      "input": "qx.event.type.Data",

      /**
       * The event is fired each time the text field looses focus and the
       * text field values has changed.
       *
       * If you change {@link #liveUpdate} to true, the changeValue event will
       * be fired after every keystroke and not only after every focus loss. In
       * that mode, the changeValue event is equal to the {@link #input} event.
       *
       * The method {@link qx.event.type.Data#getData} returns the
       * current text value of the field.
       */
      "changeValue": "qx.event.type.Data"
    },

    /*
    *****************************************************************************
       PROPERTIES
    *****************************************************************************
    */
    properties: {
      /**
       * Alignment of the text
       */
      textAlign: {
        check: ["left", "center", "right"],
        nullable: true,
        themeable: true,
        apply: "_applyTextAlign"
      },

      /** Whether the field is read only */
      readOnly: {
        check: "Boolean",
        apply: "_applyReadOnly",
        event: "changeReadOnly",
        init: false
      },
      // overridden
      selectable: {
        refine: true,
        init: true
      },
      // overridden
      focusable: {
        refine: true,
        init: true
      },

      /** Maximal number of characters that can be entered in the TextArea. */
      maxLength: {
        apply: "_applyMaxLength",
        check: "PositiveInteger",
        init: Infinity
      },

      /**
       * Whether the {@link #changeValue} event should be fired on every key
       * input. If set to true, the changeValue event is equal to the
       * {@link #input} event.
       */
      liveUpdate: {
        check: "Boolean",
        init: false
      },

      /**
       * Fire a {@link #changeValue} event whenever the content of the
       * field matches the given regular expression. Accepts both regular
       * expression objects as well as strings for input.
       */
      liveUpdateOnRxMatch: {
        check: "RegExp",
        transform: "_string2RegExp",
        init: null
      },

      /**
       * String value which will be shown as a hint if the field is all of:
       * unset, unfocused and enabled. Set to null to not show a placeholder
       * text.
       */
      placeholder: {
        check: "String",
        nullable: true,
        apply: "_applyPlaceholder"
      },

      /**
       * RegExp responsible for filtering the value of the textfield. the RegExp
       * gives the range of valid values.
       * Note: The regexp specified is applied to each character in turn, 
       * NOT to the entire string. So only regular expressions matching a 
       * single character make sense in the context.
       * The following example only allows digits in the textfield.
       * <pre class='javascript'>field.setFilter(/[0-9]/);</pre>
       */
      filter: {
        check: "RegExp",
        nullable: true,
        init: null
      }
    },

    /*
    *****************************************************************************
       MEMBERS
    *****************************************************************************
    */
    members: {
      __P_164_3: true,
      _placeholder: null,
      __P_164_4: null,
      __P_164_5: null,
      __P_164_2: true,
      __P_164_6: null,
      __P_164_7: null,

      /*
      ---------------------------------------------------------------------------
        WIDGET API
      ---------------------------------------------------------------------------
      */
      // overridden
      getFocusElement: function getFocusElement() {
        var el = this.getContentElement();

        if (el) {
          return el;
        }
      },

      /**
       * Creates the input element. Derived classes may override this
       * method, to create different input elements.
       *
       * @return {qx.html.Input} a new input element.
       */
      _createInputElement: function _createInputElement() {
        return new qx.html.Input("text");
      },
      // overridden
      renderLayout: function renderLayout(left, top, width, height) {
        var updateInsets = this._updateInsets;
        var changes = qx.ui.form.AbstractField.prototype.renderLayout.base.call(this, left, top, width, height); // Directly return if superclass has detected that no
        // changes needs to be applied

        if (!changes) {
          return;
        }

        var inner = changes.size || updateInsets;
        var pixel = "px";

        if (inner || changes.local || changes.margin) {
          var innerWidth = width;
          var innerHeight = height;
        }

        var input = this.getContentElement(); // we don't need to update positions on native placeholders

        if (updateInsets && this.__P_164_2) {
          if (this.__P_164_2) {
            var insets = this.getInsets();

            this._getPlaceholderElement().setStyles({
              paddingTop: insets.top + pixel,
              paddingRight: insets.right + pixel,
              paddingBottom: insets.bottom + pixel,
              paddingLeft: insets.left + pixel
            });
          }
        }

        if (inner || changes.margin) {
          // we don't need to update dimensions on native placeholders
          if (this.__P_164_2) {
            var insets = this.getInsets();

            this._getPlaceholderElement().setStyles({
              "width": innerWidth - insets.left - insets.right + pixel,
              "height": innerHeight - insets.top - insets.bottom + pixel
            });
          }

          input.setStyles({
            "width": innerWidth + pixel,
            "height": innerHeight + pixel
          });

          this._renderContentElement(innerHeight, input);
        }

        if (changes.position) {
          if (this.__P_164_2) {
            this._getPlaceholderElement().setStyles({
              "left": left + pixel,
              "top": top + pixel
            });
          }
        }
      },

      /**
       * Hook into {@link qx.ui.form.AbstractField#renderLayout} method.
       * Called after the contentElement has a width and an innerWidth.
       *
       * Note: This was introduced to fix BUG#1585
       *
       * @param innerHeight {Integer} The inner height of the element.
       * @param element {Element} The element.
       */
      _renderContentElement: function _renderContentElement(innerHeight, element) {//use it in child classes
      },
      // overridden
      _createContentElement: function _createContentElement() {
        // create and add the input element
        var el = this._createInputElement(); // initialize the html input


        el.setSelectable(this.getSelectable());
        el.setEnabled(this.getEnabled()); // Add listener for input event

        el.addListener("input", this._onHtmlInput, this); // Disable HTML5 spell checking

        el.setAttribute("spellcheck", "false");
        el.addClass("qx-abstract-field"); // IE8 in standard mode needs some extra love here to receive events.

        if (qx.core.Environment.get("engine.name") == "mshtml" && qx.core.Environment.get("browser.documentmode") == 8) {
          el.setStyles({
            backgroundImage: "url(" + qx.util.ResourceManager.getInstance().toUri("qx/static/blank.gif") + ")"
          });
        }

        return el;
      },
      // overridden
      _applyEnabled: function _applyEnabled(value, old) {
        qx.ui.form.AbstractField.prototype._applyEnabled.base.call(this, value, old);

        this.getContentElement().setEnabled(value);

        if (this.__P_164_2) {
          if (value) {
            this._showPlaceholder();
          } else {
            this._removePlaceholder();
          }
        } else {
          var input = this.getContentElement(); // remove the placeholder on disabled input elements

          input.setAttribute("placeholder", value ? this.getPlaceholder() : "");
        }
      },
      // default text sizes

      /**
       * @lint ignoreReferenceField(__textSize)
       */
      __P_164_8: {
        width: 16,
        height: 16
      },
      // overridden
      _getContentHint: function _getContentHint() {
        return {
          width: this.__P_164_8.width * 10,
          height: this.__P_164_8.height || 16
        };
      },
      // overridden
      _applyFont: function _applyFont(value, old) {
        if (old && this.__P_164_6 && this.__P_164_7) {
          this.__P_164_6.removeListenerById(this.__P_164_7);

          this.__P_164_7 = null;
        } // Apply


        var styles;

        if (value) {
          this.__P_164_6 = qx.theme.manager.Font.getInstance().resolve(value);

          if (this.__P_164_6 instanceof qx.bom.webfonts.WebFont) {
            this.__P_164_7 = this.__P_164_6.addListener("changeStatus", this._onWebFontStatusChange, this);
          }

          styles = this.__P_164_6.getStyles();
        } else {
          styles = qx.bom.Font.getDefaultStyles();
        } // check if text color already set - if so this local value has higher priority


        if (this.getTextColor() != null) {
          delete styles["color"];
        } // apply the font to the content element
        // IE 8 - 10 (but not 11 Preview) will ignore the lineHeight value
        // unless it's applied directly.


        if (qx.core.Environment.get("engine.name") == "mshtml" && qx.core.Environment.get("browser.documentmode") < 11) {
          qx.html.Element.flush();
          this.getContentElement().setStyles(styles, true);
        } else {
          this.getContentElement().setStyles(styles);
        } // the font will adjust automatically on native placeholders


        if (this.__P_164_2) {
          // don't apply the color to the placeholder
          delete styles["color"]; // apply the font to the placeholder

          this._getPlaceholderElement().setStyles(styles);
        } // Compute text size


        if (value) {
          this.__P_164_8 = qx.bom.Label.getTextSize("A", styles);
        } else {
          delete this.__P_164_8;
        } // Update layout


        qx.ui.core.queue.Layout.add(this);
      },
      // overridden
      _applyTextColor: function _applyTextColor(value, old) {
        if (value) {
          this.getContentElement().setStyle("color", qx.theme.manager.Color.getInstance().resolve(value));
        } else {
          this.getContentElement().removeStyle("color");
        }
      },
      // property apply
      _applyMaxLength: function _applyMaxLength(value, old) {
        if (value) {
          this.getContentElement().setAttribute("maxLength", value);
        } else {
          this.getContentElement().removeAttribute("maxLength");
        }
      },
      // property transform
      _string2RegExp: function _string2RegExp(value, old) {
        if (qx.lang.Type.isString(value)) {
          value = new RegExp(value);
        }

        return value;
      },
      // overridden
      tabFocus: function tabFocus() {
        qx.ui.form.AbstractField.prototype.tabFocus.base.call(this);
        this.selectAllText();
      },

      /**
       * Returns the text size.
       * @return {Map} The text size.
       */
      _getTextSize: function _getTextSize() {
        return this.__P_164_8;
      },

      /*
      ---------------------------------------------------------------------------
        EVENTS
      ---------------------------------------------------------------------------
      */

      /**
       * Event listener for native input events. Redirects the event
       * to the widget. Also checks for the filter and max length.
       *
       * @param e {qx.event.type.Data} Input event
       */
      _onHtmlInput: function _onHtmlInput(e) {
        var value = e.getData();
        var fireEvents = true;
        this.__P_164_3 = false; // value unchanged; Firefox fires "input" when pressing ESC [BUG #5309]

        if (this.__P_164_5 && this.__P_164_5 === value) {
          fireEvents = false;
        } // check for the filter


        if (this.getFilter() != null) {
          var filteredValue = this._validateInput(value);

          if (filteredValue != value) {
            fireEvents = this.__P_164_5 !== filteredValue;
            value = filteredValue;
            this.getContentElement().setValue(value);
          }
        } // fire the events, if necessary


        if (fireEvents) {
          // store the old input value
          this.fireDataEvent("input", value, this.__P_164_5);
          this.__P_164_5 = value; // check for the live change event

          if (this.getLiveUpdate()) {
            this.__P_164_9(value);
          } // check for the liveUpdateOnRxMatch change event
          else {
              var fireRx = this.getLiveUpdateOnRxMatch();

              if (fireRx && value.match(fireRx)) {
                this.__P_164_9(value);
              }
            }
        }
      },

      /**
       * Triggers text size recalculation after a web font was loaded
       *
       * @param ev {qx.event.type.Data} "changeStatus" event
       */
      _onWebFontStatusChange: function _onWebFontStatusChange(ev) {
        if (ev.getData().valid === true) {
          var styles = this.__P_164_6.getStyles();

          this.__P_164_8 = qx.bom.Label.getTextSize("A", styles);
          qx.ui.core.queue.Layout.add(this);
        }
      },

      /**
       * Handles the firing of the changeValue event including the local cache
       * for sending the old value in the event.
       *
       * @param value {String} The new value.
       */
      __P_164_9: function __P_164_9(value) {
        var old = this.__P_164_4;
        this.__P_164_4 = value;

        if (old != value) {
          this.fireNonBubblingEvent("changeValue", qx.event.type.Data, [value, old]);
        }
      },

      /*
      ---------------------------------------------------------------------------
        TEXTFIELD VALUE API
      ---------------------------------------------------------------------------
      */

      /**
       * Sets the value of the textfield to the given value.
       *
       * @param value {String} The new value
       */
      setValue: function setValue(value) {
        if (this.isDisposed()) {
          return null;
        } // handle null values


        if (value === null) {
          // just do nothing if null is already set
          if (this.__P_164_3) {
            return value;
          }

          value = "";
          this.__P_164_3 = true;
        } else {
          this.__P_164_3 = false; // native placeholders will be removed by the browser

          if (this.__P_164_2) {
            this._removePlaceholder();
          }
        }

        if (qx.lang.Type.isString(value)) {
          var elem = this.getContentElement();

          if (elem.getValue() != value) {
            var oldValue = elem.getValue();
            elem.setValue(value);
            var data = this.__P_164_3 ? null : value;
            this.__P_164_4 = oldValue;

            this.__P_164_9(data); // reset the input value on setValue calls [BUG #6892]


            this.__P_164_5 = this.__P_164_4;
          } // native placeholders will be shown by the browser


          if (this.__P_164_2) {
            this._showPlaceholder();
          }

          return value;
        }

        throw new Error("Invalid value type: " + value);
      },

      /**
       * Returns the current value of the textfield.
       *
       * @return {String|null} The current value
       */
      getValue: function getValue() {
        return this.isDisposed() || this.__P_164_3 ? null : this.getContentElement().getValue();
      },

      /**
       * Resets the value to the default
       */
      resetValue: function resetValue() {
        this.setValue(null);
      },

      /**
       * Event listener for change event of content element
       *
       * @param e {qx.event.type.Data} Incoming change event
       */
      _onChangeContent: function _onChangeContent(e) {
        this.__P_164_3 = e.getData() === null;

        this.__P_164_9(e.getData());
      },

      /*
      ---------------------------------------------------------------------------
        TEXTFIELD SELECTION API
      ---------------------------------------------------------------------------
      */

      /**
       * Returns the current selection.
       * This method only works if the widget is already created and
       * added to the document.
       *
       * @return {String|null}
       */
      getTextSelection: function getTextSelection() {
        return this.getContentElement().getTextSelection();
      },

      /**
       * Returns the current selection length.
       * This method only works if the widget is already created and
       * added to the document.
       *
       * @return {Integer|null}
       */
      getTextSelectionLength: function getTextSelectionLength() {
        return this.getContentElement().getTextSelectionLength();
      },

      /**
       * Returns the start of the text selection
       *
       * @return {Integer|null} Start of selection or null if not available
       */
      getTextSelectionStart: function getTextSelectionStart() {
        return this.getContentElement().getTextSelectionStart();
      },

      /**
       * Returns the end of the text selection
       *
       * @return {Integer|null} End of selection or null if not available
       */
      getTextSelectionEnd: function getTextSelectionEnd() {
        return this.getContentElement().getTextSelectionEnd();
      },

      /**
       * Set the selection to the given start and end (zero-based).
       * If no end value is given the selection will extend to the
       * end of the textfield's content.
       * This method only works if the widget is already created and
       * added to the document.
       *
       * @param start {Integer} start of the selection (zero-based)
       * @param end {Integer} end of the selection
       */
      setTextSelection: function setTextSelection(start, end) {
        this.getContentElement().setTextSelection(start, end);
      },

      /**
       * Clears the current selection.
       * This method only works if the widget is already created and
       * added to the document.
       *
       */
      clearTextSelection: function clearTextSelection() {
        this.getContentElement().clearTextSelection();
      },

      /**
       * Selects the whole content
       *
       */
      selectAllText: function selectAllText() {
        this.setTextSelection(0);
      },

      /*
      ---------------------------------------------------------------------------
        PLACEHOLDER HELPERS
      ---------------------------------------------------------------------------
      */
      // overridden
      setLayoutParent: function setLayoutParent(parent) {
        qx.ui.form.AbstractField.prototype.setLayoutParent.base.call(this, parent);

        if (this.__P_164_2) {
          if (parent) {
            this.getLayoutParent().getContentElement().add(this._getPlaceholderElement());
          } else {
            var placeholder = this._getPlaceholderElement();

            placeholder.getParent().remove(placeholder);
          }
        }
      },

      /**
       * Helper to show the placeholder text in the field. It checks for all
       * states and possible conditions and shows the placeholder only if allowed.
       */
      _showPlaceholder: function _showPlaceholder() {
        var fieldValue = this.getValue() || "";
        var placeholder = this.getPlaceholder();

        if (placeholder != null && fieldValue == "" && !this.hasState("focused") && !this.hasState("disabled")) {
          if (this.hasState("showingPlaceholder")) {
            this._syncPlaceholder();
          } else {
            // the placeholder will be set as soon as the appearance is applied
            this.addState("showingPlaceholder");
          }
        }
      },

      /**
       * Remove the fake placeholder
       */
      _onPointerDownPlaceholder: function _onPointerDownPlaceholder() {
        window.setTimeout(function () {
          this.focus();
        }.bind(this), 0);
      },

      /**
       * Helper to remove the placeholder. Deletes the placeholder text from the
       * field and removes the state.
       */
      _removePlaceholder: function _removePlaceholder() {
        if (this.hasState("showingPlaceholder")) {
          if (this.__P_164_2) {
            this._getPlaceholderElement().setStyle("visibility", "hidden");
          }

          this.removeState("showingPlaceholder");
        }
      },

      /**
       * Updates the placeholder text with the DOM
       */
      _syncPlaceholder: function _syncPlaceholder() {
        if (this.hasState("showingPlaceholder") && this.__P_164_2) {
          this._getPlaceholderElement().setStyle("visibility", "visible");
        }
      },

      /**
       * Returns the placeholder label and creates it if necessary.
       */
      _getPlaceholderElement: function _getPlaceholderElement() {
        if (this._placeholder == null) {
          // create the placeholder
          this._placeholder = new qx.html.Label();
          var colorManager = qx.theme.manager.Color.getInstance();

          this._placeholder.setStyles({
            "zIndex": 11,
            "position": "absolute",
            "color": colorManager.resolve("text-placeholder"),
            "whiteSpace": "normal",
            // enable wrap by default
            "cursor": "text",
            "visibility": "hidden"
          });

          this._placeholder.addListener("pointerdown", this._onPointerDownPlaceholder, this);
        }

        return this._placeholder;
      },

      /**
       * Locale change event handler
       *
       * @signature function(e)
       * @param e {Event} the change event
       */
      _onChangeLocale: function _onChangeLocale(e) {
        var content = this.getPlaceholder();

        if (content && content.translate) {
          this.setPlaceholder(content.translate());
        }
      },
      // overridden
      _onChangeTheme: function _onChangeTheme() {
        qx.ui.form.AbstractField.prototype._onChangeTheme.base.call(this);

        if (this._placeholder) {
          // delete the placeholder element because it uses a theme dependent color
          this._placeholder.dispose();

          this._placeholder = null;
        }

        if (!this.__P_164_2 && qx.ui.form.AbstractField.__P_164_0) {
          qx.bom.Stylesheet.removeSheet(qx.ui.form.AbstractField.__P_164_0);
          qx.ui.form.AbstractField.__P_164_0 = null;

          qx.ui.form.AbstractField.__P_164_1();
        }
      },

      /**
       * Validates the the input value.
       * 
       * @param value {Object} The value to check
       * @returns The checked value
       */
      _validateInput: function _validateInput(value) {
        var filteredValue = value;
        var filter = this.getFilter(); // If no filter is set return just the value

        if (filter !== null) {
          filteredValue = "";
          var index = value.search(filter);
          var processedValue = value;

          while (index >= 0 && processedValue.length > 0) {
            filteredValue = filteredValue + processedValue.charAt(index);
            processedValue = processedValue.substring(index + 1, processedValue.length);
            index = processedValue.search(filter);
          }
        }

        return filteredValue;
      },

      /*
      ---------------------------------------------------------------------------
        PROPERTY APPLY ROUTINES
      ---------------------------------------------------------------------------
      */
      // property apply
      _applyPlaceholder: function _applyPlaceholder(value, old) {
        if (this.__P_164_2) {
          this._getPlaceholderElement().setValue(value);

          if (value != null) {
            this.addListener("focusin", this._removePlaceholder, this);
            this.addListener("focusout", this._showPlaceholder, this);

            this._showPlaceholder();
          } else {
            this.removeListener("focusin", this._removePlaceholder, this);
            this.removeListener("focusout", this._showPlaceholder, this);

            this._removePlaceholder();
          }
        } else {
          // only apply if the widget is enabled
          if (this.getEnabled()) {
            this.getContentElement().setAttribute("placeholder", value);

            if (qx.core.Environment.get("browser.name") === "firefox" && parseFloat(qx.core.Environment.get("browser.version")) < 36 && this.getContentElement().getNodeName() === "textarea" && !this.getContentElement().getDomElement()) {
              /* qx Bug #8870: Firefox 35 will not display a text area's
                 placeholder text if the attribute is set before the
                 element is added to the DOM. This is fixed in FF 36. */
              this.addListenerOnce("appear", function () {
                this.getContentElement().getDomElement().removeAttribute("placeholder");
                this.getContentElement().getDomElement().setAttribute("placeholder", value);
              }, this);
            }
          }
        }
      },
      // property apply
      _applyTextAlign: function _applyTextAlign(value, old) {
        this.getContentElement().setStyle("textAlign", value);
      },
      // property apply
      _applyReadOnly: function _applyReadOnly(value, old) {
        var element = this.getContentElement();
        element.setAttribute("readOnly", value);

        if (value) {
          this.addState("readonly");
          this.setFocusable(false);
        } else {
          this.removeState("readonly");
          this.setFocusable(true);
        }
      }
    },
    defer: function defer(statics) {
      var css = "border: none;padding: 0;margin: 0;display : block;background : transparent;outline: none;appearance: none;position: absolute;autoComplete: off;resize: none;border-radius: 0;";
      qx.ui.style.Stylesheet.getInstance().addRule(".qx-abstract-field", css);
    },

    /*
    *****************************************************************************
       DESTRUCTOR
    *****************************************************************************
    */
    destruct: function destruct() {
      if (this._placeholder) {
        this._placeholder.removeListener("pointerdown", this._onPointerDownPlaceholder, this);

        var parent = this._placeholder.getParent();

        if (parent) {
          parent.remove(this._placeholder);
        }

        this._placeholder.dispose();
      }

      this._placeholder = this.__P_164_6 = null;
      {
        qx.locale.Manager.getInstance().removeListener("changeLocale", this._onChangeLocale, this);
      }

      if (this.__P_164_6 && this.__P_164_7) {
        this.__P_164_6.removeListenerById(this.__P_164_7);
      }

      this.getContentElement().removeListener("input", this._onHtmlInput, this);
    }
  });
  qx.ui.form.AbstractField.$$dbClassInfo = $$dbClassInfo;
})();

//# sourceMappingURL=AbstractField.js.map?dt=1595486312232