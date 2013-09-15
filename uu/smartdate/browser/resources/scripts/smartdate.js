/**
*   smartdate.js / seanupton@hsc.utah.edu
*
*   (c) 2011, 2013 The University of Utah -- JavaScript source available as
*       free software under either GNU GPLv2 and MIT-style at your choosing.
*
*/

/*jshint browser: true, nomen: false, eqnull: true, es5:true, trailing:true */


var smartdate = (function (ns, $) {
    "use strict";

    ns.log = function (msg) {};  // default is silent, can be overridden

    // namespaced constants:
    ns.INPUTHINT_HELP = String() +
        '<div class="helptext">' +
        '  Press <strong>&lt;ENTER&gt;</strong> to accept suggestion.' +
        '</div>';
    ns.FIVE_YEARS_MS = 5 * 365 * 24 * 60 * 60 * 1000;

    ns.hookup_wrappers = function () {
        // for all elements matching input, if unwrapped in div.smartdate, wrap
        var inputs = $('input.smartdate-widget');
        inputs.each(function () {
            var input = $(this);
            input.attr('autocomplete', 'off');
            if (input.parents('.datagridwidget-empty-row').length) return;  // TODO: make ignore pluggable?
            if (!input.parent().hasClass('smartdate')) {
                input.wrap('<div class="smartdate" />');
                input.after('<div class="cleardiv" />');
            }
        });
    };

    ns.get_date_inputs = function(classname) {
        var basename = 'div.smartdate input.smartdate-widget.date-field',
            addClass = (
                (classname === 'use-iso') || (classname === 'use-locale')
            );
        return (addClass) ? $(basename + '.' + classname) : $(basename);
    };

    /** locale_format(): Return two-element array of format, title.
      * allow for a padded help-text title for en-US, en-PH, en-ZW,
      * fa-IR, sw-KE, and any other locales with a M/d/yyyy format.
      */
    ns.locale_format = function () {
        var fmt = Date.CultureInfo.formatPatterns.shortDate,
            title = (fmt === 'M/d/yyyy') ? 'MM/DD/YYYY' : fmt;
        return [fmt, title]; /* fmt, title */
    };

    ns.hookup_placeholder = function () {
        var fmt_title = ns.locale_format()[1],  // format title
            long_title = 'Input: ' + fmt_title +
                ', browse calendar (&darr;) or type a shortcut ' +
                '(e.g. &quot;7/1&quot; or &quot;today&quot;).',
            locale_inputs = ns.get_date_inputs(),
            iso_inputs = ns.get_date_inputs('use-iso');

        locale_inputs.attr('placeholder', fmt_title).attr('title', long_title);
        fmt_title = 'YYYY-MM-DD';  // ISO 8601 for all others
        iso_inputs.attr('placeholder', fmt_title).attr('title', long_title);

        ns.log('smartdate: hookup date input placholder/title attributes');
    };

    ns.bind_trigger_hide_calendar = function () {
        var triggerlink = $(this);
        var input = triggerlink.prev('input');
        var picker = input.data('dateinput');
        picker.hide();
    };

    ns.hookup_datepicker = function () {
        var fmt = ns.locale_format()[0]; //closure avoids multiple calls

        //localize calendar picker using DateJS globalization info
        $.tools.dateinput.localize(Date.CultureInfo.name.split('-')[0], {
            months: Date.CultureInfo.monthNames.join(','),
            shortMonths: Date.CultureInfo.abbreviatedMonthNames.join(','),
            days: Date.CultureInfo.dayNames.join(','),
            shortDays: Date.CultureInfo.abbreviatedDayNames.join(','),
        });

        ns.get_date_inputs().each(function(index) {
            var input = $(this),
                useISO = input.hasClass('use-iso'),
                usefmt = (useISO) ? 'yyyy-mm-dd' : fmt.toLowerCase(),
                triggerlink;
            // setup dateinput, but unbind click/focus triggers, and use
            // extrinsic trigger link to toggle calendar widget
            // Also unbind the keydown event so that we can use real input.
            input.dateinput({
                format: usefmt,
                trigger: true,
                firstDay: Date.CultureInfo.firstDayOfWeek,
                lang: Date.CultureInfo.name.split('-')[0]
            }).unbind('click').unbind('keydown').unbind('focus');

            // show calendar trigger link
            triggerlink = input.next('a.caltrigger');
            triggerlink.html('Calendar');

            input.unbind('onShow').unbind('onHide');  // avoid duplicate event handling
            input.bind('onShow', function() {
                var tipapi;
                if (input.data('dateinput').isOpen()) {
                    // event filter: really showing, not just focus of input?
                    triggerlink.bind('click', ns.bind_trigger_hide_calendar);
                    ns.clearhints();
                    tipapi = input.data('tooltip');
                    if (tipapi) {
                        tipapi.hide();
                    }
                }
            });
            input.bind('onHide', function() {
                triggerlink.unbind('click', ns.bind_trigger_hide_calendar);
            });
        });

        ns.log('smartdate: hookup date picker');
    };

    ns.clearhints = function (input) {
        var single = Boolean(input),
            inputs = (single) ? $(input) : ns.get_date_inputs();
        inputs.each(function () {
            var input = $(this),
                validator = input.data('validator');
            $('div.inputhint', input.parent()).remove();
            if (single && validator) {
                validator.reset(input);          // unbinds keyup, so...
                ns.hookup_keyup_suggest(input);  // rebind keyup!
            }
        });
    };

    ns.hide_pickers = function () {
        ns.get_date_inputs().each(function() {
            $(this).data('dateinput').hide();
        }); // hide all calendar pickers that may be visible
    };

    ns.hookup_keyup_suggest = function(input) {
        var inputs = (input) ? $(input) : ns.get_date_inputs();
        inputs.keypress(function(event) {
            var which = (event.which === 0 && event.keyCode) ? event.keyCode : event.which;
            if (which === 13) return false;  // trap <ENTER> - don't submit form
            return true;
        });
        inputs.unbind('keyup');  // no dupe handling on hooked-up; rebind all
        inputs.keyup(function(event) {
            var input = $(this),
                picker = input.data('dateinput'),
                tip, val, parsed;
            ns.log('keyup: ' + event.which);
            if ((picker.isOpen()) && (37 <= event.which <= 40)) {
                // cursor arrows while picker is open, return (no hints)
                ns.clearhints(input);
                return true;
            }
            if (event.which === 40) {
                // down-arrow: pop-down calendar using keyboard
                if (!picker.isOpen()) {
                    ns.clearhints(input);
                    input.tooltip().hide();
                    $(this).data('dateinput').show();
                    return false;
                }
            }
            if (event.which === 9) {         // Tab out of input
                ns.clearhints();             // clear suggest hint/tip
                ns.hide_pickers();
                return true;
            }
            if (event.which === 27) {        // escape key clears
                ns.clearhints(input);        // clear suggest hint/tip
                input.data('dateinput').setValue(Date.parse('now'));
                input.val('');
                return false;
            }
            if (event.which === 13) {  // CR
                ns.normalize(input);         // load suggested date
                ns.clearhints(input);        // clear suggest hint/tip
                return false;  // do not submit form
            }
            val = input.val();
            parsed = Date.parse(val);
            if (parsed) {
                tip = $('div.inputhint', input.parent());
                if (tip.length === 0) {
                    input.after('<div class="inputhint"></div>');
                }
                tip = $('div.inputhint', input.parent());
                tip.html(parsed.toString(Date.CultureInfo.formatPatterns.longDate) + ' ' + ns.INPUTHINT_HELP);
            } else {
                tip = $('div.inputhint', input.parent());
                if (tip.length>0) {
                    tip.remove();
                }
            }
        });

        ns.log('smartdate: hookup keystroke suggestion handler');
    };

    ns.normalize = function (input) {
        var now = Date.parse('now'),
            val = $(input).val(),
            parsed = Date.parse(val),
            tipapi;
        if (parsed) {
            // set input value:
            $(input).val(parsed.toString(ns.locale_format()[0]));
            if (Math.abs(parsed.getTime() - now.getTime()) <= ns.FIVE_YEARS_MS) {
                // if +/- 5 years from now, set Value on calendar
                $(input).data('dateinput').setValue(parsed);
            }
            ns.clearhints();
            tipapi = $(input).data('tooltip');
            if (tipapi) {
                tipapi.hide();
            }
        }
    };

    ns.hookup_blur_use_suggestion = function () {
        // get inputs, bind blur event
        var inputs = ns.get_date_inputs();
        inputs.unbind('blur');
        inputs.bind('blur', function(event) {
            ns.log('smartdate: blur event handler');
            ns.normalize(this);
        });
        ns.log('smartdate: hookup input suggestion parsing on blur');
    };

    ns.tooltip = function (input) {
        var div = $('<div class="smartdate-tooltip">'),
            offset = $(input).parent('div.smartdate').offset(),
            inputRight = offset.left + input.width(),
            top = offset.top + 55,
            left = inputRight + 45,
            api = $(input).data('tooltip') || {
                div: div,
                show: function () {
                    div.show();
                },
                hide: function () {
                    div.hide();
                }
            };
        input.focus(api.show);
        input.blur(api.hide);
        div.html(input.attr('title') || '');
        $('body').append(div);
        div.css({
            position: 'absolute',
            display: 'block',
            top: top,
            left: left,
            opacity: 0.75
        }).hide();
        input.removeAttr('title');
        input.data('tooltip', api);
    };

    ns.hookup_tooltips = function () {
        var inputs = ns.get_date_inputs();
        inputs.each(function(index) {
            var input = $(this);
            ns.tooltip(input);
        });

        ns.log('smartdate: hookup date input tooltips');
    };

    ns.hookups = function () {
        // if used with JQT validator, hook-up validator first, then this
        ns.hookup_wrappers();            // prog-enhancement to ordinary input
        ns.hookup_placeholder();         // setup placeholder, title attrs
        ns.hookup_datepicker();          // JQuery Tools dateinput
        ns.hookup_blur_use_suggestion(); // Date-parsing on blur event
        ns.hookup_tooltips();            // tooltip uses title attr
        ns.hookup_keyup_suggest();       // Handle cursor, enter, tab, esc navigation
    };

    $(document).ready(function() {
        ns.hookups();
        ns.log('loaded smartdate');
    });

    return ns;

}(smartdate || {}, jQuery));

