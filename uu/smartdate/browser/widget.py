from z3c.form import widget
from z3c.form.browser import text
from zope.interface import implmentsOnly

from uu.smartdate.interfaces import ISmartdateWidget


class SmartdateWidget(text.TextWidget):
    """
    A smart date widget uses HTML text input but may have JavaScript
    progressive enhancements.
    """
     
    implementsOnly(ISmartdateWidget) #necessary for converter hookups
     
    def __init__(self, *args, **kwargs):
        self.klass = 'smartdate-widget use-locale' #TODO: support config, ISO
        super(SmartdateWidget, self).__init__(*args, **kwargs)


def SmartdateFieldWidget(field, request):
    """field widget factory for SmartdateWidget"""
    return widget.FieldWidget(field, SmartdateWidget(request))


