import os

from zope.component import getMultiAdapter

from uu.smartdate.locale import get_locale


# some initialized globals for use by all view instances
PRODNAME = 'uu.smartdate'
BASE_PATH = os.path.dirname(__file__)
DATEJS_PATH = '/'.join((BASE_PATH, 'resources/datejs'))
DATEJS_FILES = tuple(os.listdir(DATEJS_PATH))
DEFAULT_FILENAME = 'date.js'  # same as en-US


class DateJSRedirectView(object):
    """Redirects with HTTP 302 to locale-specific Datejs JS file"""
    
    def __init__(self, context, request):
        self.context = context
        self.request = request
        self.locale_id = self.request.locale.id
    
    def __call__(self, *args, **kwargs):
        site_url = getMultiAdapter(
            (self.context, self.request),
            name=u'plone_portal_state').portal_url()
        locale = get_locale(self.request)
        filename = DEFAULT_FILENAME
        if locale is not None and locale.id.territory is not None:
            lang = locale.id.language.lower()
            terr = locale.id.territory.upper()
            script = self.locale_id.script
            if script is not None:
                lang = '%s-%s' % (lang, script.title())
            filename = 'date-%s-%s.js' % (lang, terr)
            if filename not in DATEJS_FILES:
                filename = DEFAULT_FILENAME  # always redirect to existing file
        resource = '++resource++%s-datejs/%s' % (PRODNAME, filename)
        url = '/'.join((site_url, resource))
        self.request.response.redirect(url, status=302)

