from zope.i18n.locales import locales, LoadLocaleError
from zope.publisher.browser import BrowserLanguages


def get_locale(request):
    """
    return locale based on HTTP request header ACCEPT_LANGUAGES.

    We need languages to get locale, and the locale on the request
    object gets this wrong (removes territory part of locale). This
    does essentially what ZPublisher.HTTPRequest does to load a
    locale, but with a fixed (predictable, correct) adapter.

    zope.publisher.browser.BrowserLangauges is an adapter with
    fixed behavior to correctly get languages.  Other adapters in
    Plone packages (e.g. PTSLanguages) may interfere with
    ZPublisher.HTTPRequest.locales loading territory, so we prefer
    a fixed adapter rather than an adapter looked-up by registration
    via IUserPreferredLanguages.
    """
    locale = None
    languages = BrowserLanguages(request).getPreferredLanguages()
    for lang in languages:
        parts = (lang.split('-') + [None, None])[:3]
        try:
            locale = locales.getLocale(*parts)
            break
        except LoadLocaleError:
            pass
    return locale

