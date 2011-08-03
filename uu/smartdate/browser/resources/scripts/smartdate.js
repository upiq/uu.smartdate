/**
*   smartdate.js -  a smart date form widget atop a simple HTML5 date input
*                   or an (X)HTML text input.
* 
*   A keyboard-friendly mashup of Date.js (http://datejs.com) and the
*   JQuery Tools Dateinput picker (http://flowplayer.org/tools/dateinput/).
*
*   Features and end-user operation
*   -------------------------------
*
*     Calendar picker (from JQuery Tools)
*
*     Natural-language date parsing helpful for common shortcuts (date.js).
*
*     HTML5 placeholder text for browsers that support it (every modern
*     browser excepting MSIE), and tooltip hints for all browsers
*     (including IE).
*     
*     Basic format normalization (at the moment, to USA-style MM/DD/YYYY).
*
*     Ability to support future/historical dates via keyboard input, even
*     if they are beyond the default range of the JQuery Tools date picker
*     (which defaults to +/- 5 years).
*     
*     Keyboard-friendly:
*
*       * Normal HTML input boxes with normal tab in/out behavior.
*
*       * Typing partial dates will yield suggestions in an overlay.
*
*       * Pressing <ENTER> or <TAB> will accept any suggestion.
*
*           * <ENTER> remains in the field.
*
*           * <TAB> leaves the field and moves the focus to the next
*             widget in the form.
*
*       * Pressing the DOWN arrow button shows the calendar picker.
* 
*       * Pressing <ESC> will clear any date entered, and hides any 
*         exposed calendar picker.
*
*   Usage notes / requirements
*   --------------------------
*
*   HTML requirements (see demo.html in included distribution):
* 
*       * HTML includes date.js (http://datejs.com)
*
*       * HTML includes JQuery 1.4.x (http://jquery.com)
*
*       * HTML includes JQuery Tools 1.2.x (http://flowplayer.org/tools)
*
*       * HTML includes date.css and next/previous button images (via Plone)
*
*       * HTML wraps inputs, labels in <div class="smartdate">
*           (this is more for styling than for core functionality)
*
*       * Recommended:  HTML uses CSS image-replacement for calendar triggeri
*                       hyperlink created in DOM (by javascript).
*
*   Scripting requirements:
* 
*       * After new calendar inputs are added to the dom, run the function
*         smartdate.hookups().  This will (re-)hookup all event handlers
*         and DOM modifications for existing and new widgets added to the
*         page.
*
*   ----
*
*   Author: Sean Upton <sean.upton@hsc.utah.edu> [2011-07-27]
*
*   Copying / License:
*
*       This file and demo.html file are MIT-style (see COPYING.txt).
*
*       Other included files possibly bundled with any distribution are
*       licensed under respective upstream open-source licenses.
*
*/

var smartdate = new Object(); // a namespace
var jq = jQuery;
var DEBUG; 

if (DEBUG == undefined) DEBUG = false;


smartdate.get_date_inputs = function(classname) {
    var base_classname = 'div.smartdate input.text-widget.date-field';
    if ((classname == 'use-iso') || (classname == 'use-locale')) {
        return jq(base_classname + '.' + classname);
    }
    return jq(base_classname);
}

/** locale_format(): Return two-element array of format, title. */
smartdate.locale_format = function() {
    var fmt = Date.CultureInfo.formatPatterns.shortDate;
    if (fmt=='M/d/yyyy') {
        /* safe assumption for en-US, en-PH, en-ZW, fa-IR, sw-KE locales:
        *  Placeholder can specify multiple digits (possible, encouraged
        *  but, technically speaking, not absolutely required).
        */
        title = 'MM/DD/YYYY';
    } else {
        title = fmt;
    }
    return [fmt, title]; /* fmt, title */
}


smartdate.hookup_placeholder = function() {
    var fmt_title = smartdate.locale_format()[1]; /* format title */
    var long_title = "Input: " + fmt_title + ", browse calendar (&darr;) or type a shortcut (e.g. '7/1' or 'today').";
    var locale_inputs = smartdate.get_date_inputs('use-locale');
    var iso_inputs = smartdate.get_date_inputs('use-iso');
    
    locale_inputs.attr('placeholder', fmt_title).attr('title', long_title);
    fmt_title = 'YYYY-MM-DD'; /* ISO 8601 for all others */
    iso_inputs.attr('placeholder', fmt_title).attr('title', long_title);
    
    if (DEBUG) console.log('smartdate: hookup date input placholder/title attributes');
}


smartdate.bind_trigger_hide_calendar = function() {
    var triggerlink = jq(this);
    var input = triggerlink.prev('input');
    var picker = input.data('dateinput');
    picker.hide();
}


smartdate.hookup_datepicker = function() {
    var fmt = smartdate.locale_format()[0]; //closure avoids multiple calls
    
    smartdate.get_date_inputs().each(function(index) {
        // setup dateinput, but unbind click/focus triggers, and use
        // extrinsic trigger link to toggle calendar widget
        // Also unbind the keydown event so that we can use real input.
        var input = jq(this);
        if (input.hasClass('use-iso')) {
            var usefmt = 'yyyy-mm-dd';
        } else {
            /* format: dateinput thinks mm=month, not minutes, so lower MM */
            var usefmt = fmt.toLowerCase();
        }
        input.dateinput({
            format: usefmt,
            trigger: true
        }).unbind('click').unbind('focus').unbind('keydown');
        
        /* show calendar trigger link */
        var triggerlink = input.next('a.caltrigger');
        triggerlink.html('Calendar');

        var picker = input.data('dateinput');
        input.unbind('onShow').unbind('onHide'); /* avoid duplicate event handling */
        input.bind('onShow', function() {
            triggerlink.bind('click', smartdate.bind_trigger_hide_calendar);
            smartdate.clearhints();
        });
        input.bind('onHide', function() {
            triggerlink.unbind('click', smartdate.bind_trigger_hide_calendar);
        });
    });

    if (DEBUG) console.log('smartdate: hookup date picker');
}

smartdate.clearhints = function() {
    var inputs = jq('input.text-widget.date-field');
    for (var i=0; i<inputs.length; i++) {
        input = jq(inputs[i]);
        jq('div.inputhint', input.parent()).remove();
    }
}


smartdate.hookup_keyup_suggest = function() {
    var inputs = smartdate.get_date_inputs();
    inputs.unbind('keyup'); /* no dupe handling on hooked-up; rebind all */
    inputs.keyup(function(event) {
        var input = jq(this);
        if (event.which == 40) {
            /* down-arrow: pop-down calendar using keyboard */
            var picker = input.data('dateinput');
            if (!picker.isOpen()) {
                smartdate.clearhints();
                input.blur();
                input.focus();
                jq(this).data('dateinput').show();
                return false;
            }
        }
        if (event.which == 9) {         /* Tab out of input */
            smartdate.clearhints();
            //var picker = input.data('dateinput');
            smartdate.get_date_inputs().each(function() {
                jq(this).data('dateinput').hide();
            }); /*hide all calendar pickers that may be visible */
            //picker.hide();
            return true;
        }
        if (event.which == 27) {        /* escape key clears */
            smartdate.clearhints();
            input.data('dateinput').setValue(Date.parse('now'));
            input.val('');
            return false;
        }
        if (event.which == 13) { /* CR */
            smartdate.clearhints();
            input.blur(); /* trigger on-blur: e.g. load suggested date */
            input.focus();
            return false; //do not submit form
        }
        var val = input.val();
        var parsed = Date.parse(val);
        if (parsed) {
            var tip = jq('div.inputhint', input.parent());
            if (tip.length==0) {
                input.after('<div class="inputhint"></div>');
            }
            tip = jq('div.inputhint', input.parent());
            tip.html('' + (parsed.getMonth()+1) + '/' + parsed.getDate() + '/' + parsed.getFullYear());
        } else {
            var tip = jq('div.inputhint', input.parent());
            if (tip.length>0) {
                tip.remove();
            }
        } 
    }); 
    
    if (DEBUG) console.log('smartdate: hookup keystroke suggestion handler');
}


smartdate.hookup_blur_use_suggestion = function() {
    /* some date delta contstants: */
    var now = Date.parse('now');
    var five_years_ms = 5 * 365 * 24 * 60 * 60 * 1000; // five years in ms
    /* get inputs, bind blur event */
    var inputs = smartdate.get_date_inputs();
    inputs.bind('blur', function(event) {
        var input = jq(this);
        var val = input.val();
        var parsed = Date.parse(val);
        if (parsed) {
            /* set input value */
            input.val('' + (parsed.getMonth()+1) + '/' + parsed.getDate() +  '/' + parsed.getFullYear());
            if (Math.abs(parsed.getTime() - now.getTime()) <= five_years_ms) {
                /* if +/- 5 years from now, set Value on calendar */
                input.data('dateinput').setValue(parsed);
            }
        }
    });
    if (DEBUG) console.log('smartdate: hookup input suggestion parsing on blur');
}


smartdate.hookup_tooltips = function() {
    var inputs = smartdate.get_date_inputs();
    inputs.tooltip({
        position: "center right",
        offset: [4, 20],
        effect: "fade",
        tipClass: "smartdate-tooltip",
        opacity: 0.75
    });

    if (DEBUG) console.log('smartdate: hookup date input tooltips using jquery tools');
}


smartdate.hookups = function() {
    smartdate.hookup_placeholder();
    smartdate.hookup_datepicker();
    smartdate.hookup_keyup_suggest();
    smartdate.hookup_blur_use_suggestion();
    smartdate.hookup_tooltips();
}


jq(document).ready(function() {
    smartdate.hookups();
    if (DEBUG) console.log('loaded smartdate');
});


