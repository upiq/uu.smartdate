/**
*   monkeypatch_datagrid.js / seanupton@hsc.utah.edu
* 
*   This should be included in the JavaScript registry AFTER
*   ++resource++collective.z3cform.datagridfield/datagridfield.js
*   such that it can effectively be monkey patched.
*/


jQuery(document).ready(function() {
    if (window.dataGridField2Functions) {
        if (!window.dataGridField2Functions._orig_updateOrderIndex) {
            window.dataGridField2Functions._orig_updateOrderIndex = window.dataGridField2Functions.updateOrderIndex;
        }
        window.dataGridField2Functions.updateOrderIndex = function(tbody, backwards) {
            window.dataGridField2Functions._orig_updateOrderIndex(tbody, backwards);
            smartdate.hookups(); /* grid modified: re-hookup smartdate widgets on page */
        }
    }
    smartdate.hookups();
    smartdate.log('re-loaded smartdate after monkey patching data grid field');
});

