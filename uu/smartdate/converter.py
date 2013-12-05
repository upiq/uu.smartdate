import re
from datetime import date

from z3c.form import converter

from uu.smartdate.locale import get_locale


USA_DATE = re.compile('^([01]?[0-9])/([0123]?[0-9])/([0-9]+)$')


def normalize_usa_date(v):
    """
    normalize a date string value of m/d/y form to a datetime.date object.
    If normalization is not possible, return None.
    """
    if not isinstance(v, basestring):
        return None
    match = USA_DATE.search(v)
    if not match:
        return None
    groups = match.groups()
    try:
        month = int(groups[0])
        day = int(groups[1])
        year = int(groups[2])
    except TypeError:
        return None
    if not ((0 < month < 13) and (0 < day <= 31) and (0 < year)):
        return None
    if len(str(year)) <= 2:
        today = date.today()
        century_base = today.year - (today.year % 100)
        if year >= 70:
            century_base -= 100
        year = century_base + year
    if len(str(year)) != 4:
        return None
    try:
        if year < 1900:
            raise RuntimeError('dates prior to 1900 unsupported')  # for now
        return date(year, month, day)
    except ValueError:
        return None


class ColloquialDateConverter(converter.DateDataConverter):
    """
    ...only ethnocentric because ICU locales are broken for en-US short
       date...

    A data converter that tries MM/DD/YYYY output if the locale is
    en-US, but falls back to locale conversion when value does not
    match MM/DD/YYYY pattern.

    The reason for such behavior is that ICU locales [1] argue
    that MM/DD/YY (two-digit) year is the one and only acceptable
    short date format for US users, when in practical cultural terms
    this is deprecated in favor of four digit years.

    zope.i18n.locales mimics ICU verbatim, thus we override in
    a converter as a simple work-around.

    [1] http://demo.icu-project.org/icu-bin/locexp?_=en_US

    While the extra behavior for en-US locale differs from
    DateDataConverter superclass behavior, for all other locales,
    this acts equivalently to DataDataConverter and uses
    zope.i18n.locales for conversion (parsing, formatting).

    This attempts to only in certain constraints deviate from the
    norm of locale-based parsing.  It also tries to be forgiving
    of variations in exact syntax of American y/m/d dates...

    To quote RFC 793: "be conservative in what you do, be liberal
                       in what you accept from others."
    """

    def _use_colloquial_usa_short_date(self, value=None):
        """
        Return true if locale is en-US and value (if not None) is a string
        that matches the 'MM/DD/YYYY' pattern.
        """
        if isinstance(value, basestring):
            if normalize_usa_date(value) is None:
                return False  # non-conforming: fall back to locales parsing
        elif value is not None:
            return False
        locid = getattr(get_locale(self.widget.request), 'id', None)
        if locid is None:
            return True  # req without locale, usually test request
        if locid.territory and locid.language:
            loc = (locid.language.lower(), locid.territory.upper())
            return loc == ('en', 'US')
        return False

    def toWidgetValue(self, value):
        """
        Convert date to widget value, via:

        * MM/DD/YYYY format (short us format with four-digit
          year) if and only if locale is en-US.

        * Superclass toWidgetValue if locale is not en-US.
        """
        if value and value.year < 1900:
            # fixups for possibly improperly stored values
            normalized_year = int(str(value.year)[-2:])
            today = date.today()
            century_base = today.year - (today.year % 100)
            if normalized_year >= 70:
                century_base -= 100
            normalized_year = century_base + normalized_year
            value = date(normalized_year, *value.timetuple()[1:3])
        if self._use_colloquial_usa_short_date():
            # en-US: use strftime to get MM/DD/YYYY:
            if value is None:
                return ''
            return value.strftime('%m/%d/%Y')
        else:
            return super(ColloquialDateConverter, self).toWidgetValue(value)

    def toFieldValue(self, value):
        """
        Parse MM/DD/YYYY if locale is en-US and string value apppears
        to match that pattern.  Otherwise, use superclass (locale)
        based parsing (via zope.i18n.locales).
        """
        if isinstance(value, basestring):
            value = value.strip()
        if self._use_colloquial_usa_short_date(value):
            return normalize_usa_date(value.strip())
        super(ColloquialDateConverter, self).toFieldValue(value)

