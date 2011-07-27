Introduction
============

uu.smartdate is an add-on for Plone that adds a new JavaScript date widget
for use in z3c.form forms.  This widget is a mash-up of JQuery Tools 
"dateinput" picker and the date.js (Datejs) date parser.  It aims to be 
as keyboard-friendly as possible in modern browsers, forgiving, and 
easy to use.  The overall goal is increased reliability of input data
(fewer errors with less typing) and ease of use.

Features
--------

* z3c.form widget can be included in any z3c.form based web form.

* Calendar picker (from JQuery Tools)

* Natural-language date parsing helpful for common shortcuts (date.js).

* HTML5 placeholder text for browsers that support it (every modern
  browser excepting MSIE), and tooltip hints for all browsers
  (including IE).
 
* Basic format normalization (at the moment, to USA-style MM/DD/YYYY).

* Ability to support future/historical dates via keyboard input, even
  if they are beyond the default range of the JQuery Tools date picker
  (which defaults to +/- 5 years).
 
* Keyboard-friendly:

  * Normal HTML input boxes with normal tab in/out behavior.

  * Typing partial dates will yield suggestions in an overlay.

  * Pressing <ENTER> or <TAB> will accept any suggestion.

    * <ENTER> remains in the field.

    * <TAB> leaves the field and moves the focus to the next
      widget in the form.

   * Pressing the DOWN arrow button shows the calendar picker.

   * Pressing <ESC> will clear any date entered, and hides any 
     exposed calendar picker.

Includes
--------

* Bundles date.js (http://datejs.com) (MIT-style license).

Requires
--------

* Plone 4.0+

* plone.app.jquerytools >= 1.2

  Requires dateinput javascript be enabled explicitly in JS registry.

* z3c.form (tested against 2.4.4)

--

Author: Sean Upton <sean.upton@hsc.utah.edu>

Copyright 2011, The University of Utah.

Released as free software under the GNU GPL version 2 license.
See doc/COPYING.txt

