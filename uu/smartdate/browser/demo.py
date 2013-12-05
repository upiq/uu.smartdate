from datetime import date

from plone.z3cform.layout import wrap_form
from z3c.form import form, field, button
from zope.interface import Interface, implements
from zope import schema


from uu.smartdate.browser.widget import SmartdateFieldWidget


class IDateDemoSchema(Interface):
    """Demo form schema for smart-date"""
    title = schema.TextLine(title=u'title', required=False)
    start = schema.Date(title=u'Start date', required=True)
    stop = schema.Date(title=u'Stop date', required=True)


class DateDemoRecord(object):
    """Dummy record for demo"""

    implements(IDateDemoSchema)

    def __init__(self, title=u'', start=date.today(), end=date.today()):
        self.title = title
        self.start = start
        self.end = end


class DateDemoForm(form.Form):
    """A demo form for testing date"""
    fields = field.Fields(IDateDemoSchema)
    ignoreContext = True
    label = u'Date form demo'

    def updateWidgets(self):
        datefields = [f.field for f in self.fields.values()
                      if schema.interfaces.IDate.providedBy(f.field)]
        for field in datefields:
            self.fields[field.__name__].widgetFactory = SmartdateFieldWidget
        super(DateDemoForm, self).updateWidgets()

    @button.buttonAndHandler(u'Submit form')
    def handleApply(self, action):
        data, errors = self.extractData()
        if errors:
            self.status = self.formErrorsMessage
            return
        if 'start' in data:
            print data['start']
        if 'stop' in data:
            print data['stop']


class DateDemoDisplayForm(form.DisplayForm):
    """Display form for date demo"""
    fields = field.Fields(IDateDemoSchema)
    ignoreContext = True
    label = u'Date form demo'
    enctype = 'multipart/form-data'

    def updateWidgets(self):
        datefields = [f.field for f in self.fields.values()
                      if schema.interfaces.IDate.providedBy(f.field)]
        for field in datefields:
            self.fields[field.__name__].widgetFactory = SmartdateFieldWidget
        super(DateDemoDisplayForm, self).updateWidgets()


DateDemoFormView = wrap_form(DateDemoForm)
DateDemoDisplayFormView = wrap_form(DateDemoDisplayForm)


class SmartDateDemoView(object):
    """Simple dummy view for testing a static version of the form"""
    def __init__(self, context, request):
        self.context = context
        self.request = request

