/**
*   smartdate.js / seanupton@hsc.utah.edu
* 
*   (c) 2011 The University of Utah -- this JavaScript source available as
*       free software under either GNU GPLv2 and MIT-style at your choosing.
*
*/

var smartdate = new Object(); // a namespace
var jq = jQuery;
var DEBUG; 

/* namespaced constants: */
smartdate.INPUTHINT_HELP = '<div class="helptext">Press <strong>&lt;ENTER&gt;</strong> to accept suggestion.</div>';
smartdate.FIVE_YEARS_MS = 5 * 365 * 24 * 60 * 60 * 1000; // five years in ms

if (DEBUG == undefined) DEBUG = false;


smartdate.hookup_wrappers = function() {
    /* for all elements matching input, if unwrapped in div.smartdate, wrap */
    var inputs = jq('input.smartdate-widget');
    for (var i=0; i<inputs.length; i++) {
        var input = jq(inputs[i]);
        input.attr('autocomplete', 'off');
        if (!input.parent().hasClass('smartdate')) {
            input.wrap('<div class="smartdate" />');
            input.after('<div class="cleardiv" />');
        }
    }
}


smartdate.get_date_inputs = function(classname) {
    var base_classname = 'div.smartdate input.smartdate-widget.date-field';
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
            //input.tooltip().hide();
            triggerlink.bind('click', smartdate.bind_trigger_hide_calendar);
            smartdate.clearhints();
        });
        input.bind('onHide', function() {
            triggerlink.unbind('click', smartdate.bind_trigger_hide_calendar);
        });
    });

    if (DEBUG) console.log('smartdate: hookup date picker');
}

smartdate.clearhints = function(input) {
    var inputs = smartdate.get_date_inputs();
    if (input) {
        input = jq(input);
        jq('div.inputhint', input.parent()).remove();
        if (input.data('validator')) {
            input.data('validator').reset(input);   /* will unbind keyup, so... */
            smartdate.hookup_keyup_suggest(input); /* rebind keyup! */
        }
    } else {
        for (var i=0; i<inputs.length; i++) {
            input = jq(inputs[i]);
            jq('div.inputhint', input.parent()).remove();
        }
    }
}


smartdate.hide_pickers = function() {
    smartdate.get_date_inputs().each(function() {
        jq(this).data('dateinput').hide();
    }); /*hide all calendar pickers that may be visible */
}


smartdate.hookup_keyup_suggest = function(input) {
    var inputs;
    if (input) {
        inputs = jq(input);
    } else {
        inputs = smartdate.get_date_inputs();
    }
    inputs.keypress(function(event) {
        var which = (event.which==0 && event.keyCode) ? event.keyCode : event.which;
        if (which == 13) return false; /* trap <ENTER> - don't submit form */
        return true;
    });
    inputs.unbind('keyup'); /* no dupe handling on hooked-up; rebind all */
    if (DEBUG) console.log('keyups unbound');
    inputs.keyup(function(event) {
        if (DEBUG) console.log('keyup: ' + event.which);
        var input = jq(this);
        var picker = input.data('dateinput');
        if ((picker.isOpen()) && (37 <= event.which <= 40)) {
            /* cursor arrows while picker is open, return (no hints) */
            smartdate.clearhints(input);
            return true;
        }
        if (event.which == 40) {
            /* down-arrow: pop-down calendar using keyboard */
            if (!picker.isOpen()) {
                smartdate.clearhints(input);
                input.blur();
                input.focus();
                jq(this).data('dateinput').show();
                return false;
            }
        }
        if (event.which == 9) {         /* Tab out of input */
            smartdate.clearhints();                     /* clear suggest hint/tip */
            smartdate.hide_pickers();
            return true;
        }
        if (event.which == 27) {        /* escape key clears */
            smartdate.clearhints(input);                /* clear suggest hint/tip */
            input.data('dateinput').setValue(Date.parse('now'));
            input.val('');
            return false;
        }
        if (event.which == 13) { /* CR */
            smartdate.parse(input);                     /* load suggested date */
            smartdate.clearhints(input);                /* clear suggest hint/tip */
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
            tip.html(parsed.toString(Date.CultureInfo.formatPatterns.longDate) + ' ' + smartdate.INPUTHINT_HELP);
        } else {
            var tip = jq('div.inputhint', input.parent());
            if (tip.length>0) {
                tip.remove();
            }
        } 
    }); 
    
    if (DEBUG) console.log('smartdate: hookup keystroke suggestion handler');
}


smartdate.parse = function(input) {
    input = jq(input); // wrap if/as needed
    var now = Date.parse('now');
    var val = input.val();
    var parsed = Date.parse(val);
    if (parsed) {
        /* set input value */
        input.val(parsed.toString(smartdate.locale_format()[0]));
        if (Math.abs(parsed.getTime() - now.getTime()) <= smartdate.FIVE_YEARS_MS) {
            /* if +/- 5 years from now, set Value on calendar */
            input.data('dateinput').setValue(parsed);
        }
        smartdate.clearhints();
    }
}

smartdate.hookup_blur_use_suggestion = function() {
    /* get inputs, bind blur event */
    var inputs = smartdate.get_date_inputs();
    inputs.unbind('blur');
    inputs.bind('blur', function(event) {
        if (DEBUG) console.log('smartdate: blur event handler');
        smartdate.parse(this);
    });
    if (DEBUG) console.log('smartdate: hookup input suggestion parsing on blur');
}


smartdate.hookup_tooltips = function() {
    var inputs = smartdate.get_date_inputs();
    inputs.tooltip({
        position: "center right",
        offset: [4, 25],
        effect: "fade",
        tipClass: "smartdate-tooltip",
        opacity: 0.75
    });

    if (DEBUG) console.log('smartdate: hookup date input tooltips using jquery tools');
}


smartdate.hookups = function() {
    smartdate.hookup_wrappers(); // necessary for prog. enh.
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


