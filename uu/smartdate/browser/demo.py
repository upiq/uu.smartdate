from plone.z3cform.layout import wrap_form
from z3c.form import form, field, button
from zope.interface import Interface
from zope import schema


from uu.smartdate.browser.widget import SmartdateFieldWidget 

class IDateDemoSchema(Interface):
    """Demo form schema for smart-date"""
    title = schema.TextLine(title=u'title', required=False)
    start = schema.Date(title=u'Start date', required=True)
    stop = schema.Date(title=u'Stop date', required=True)


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


DateDemoFormView = wrap_form(DateDemoForm)

class SmartDateDemoView(object):
    """Simple dummy view for testing a static version of the form"""
    def __init__(self, context, request):
        self.context = context
        self.request = request

