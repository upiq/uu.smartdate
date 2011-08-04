from zope.interface import Interface


class ISmartdateProductLayer(Interface):
    """Marker interface for product browser layer"""


class ISmartdateWidget(IWidget):
    """
    Marker for date widget that uses text input and converters from this
    package.
    """


