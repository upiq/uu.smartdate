import os

# some initialized globals for use by all view instances
PRODNAME = 'uu.smartdate'
BASE_PATH = os.path.dirname(__file__)
DATEJS_PATH = '/'.join((BASE_PATH, 'resources/datejs'))
DATEJS_FILES = tuple(os.listdir(DATEJS_PATH))
DEFAULT_FILENAME = 'date.js' # same as en-US


class DateJSRedirectView(object):
    """Redirects with HTTP 302 to locale-specific Datejs JS file"""
    
    def __init__(self, context, request):
        self.context = context
        self.request = request
        self.locale_id = self.request.locale.id
    
    def __call__(self, *args, **kwargs):
        lang = self.locale_id.language.lower()
        terr = self.locale_id.territory.upper()
        script = self.locale_id.script
        if script is not None:
            lang = '%s-%s' % (lang, script.title())
        filename = 'date-%s-%s.js' % (lang, terr)
        if filename not in DATEJS_FILES:
            filename = DEFAULT_FILENAME # always redirect to file that exists
        resource = '++resource++%s-datejs/%s' (PRODNAME, filename)
        url = '/'.join((site_url, resource))
        self.request.response.redirect(url, status=302)

