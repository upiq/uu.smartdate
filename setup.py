from setuptools import setup, find_packages
import os

version = '0.1dev'

setup(name='uu.smartdate',
      version=version,
      description="Plone add-on: JavaScript form widget for smart date input.",
      long_description=open("README.txt").read() + "\n" +
                       open(os.path.join("docs", "HISTORY.txt")).read(),
      classifiers=[
        "Programming Language :: Python",
        "Framework :: Plone",
        ],
      keywords='',
      author='Sean Upton',
      author_email='sean.upton@hsc.utah.edu',
      url='http://launchpad.net/upiq',
      license='GPL',
      packages=find_packages(exclude=['ez_setup']),
      namespace_packages=['uu'],
      include_package_data=True,
      zip_safe=False,
      install_requires=[
          'setuptools',
          'Products.CMFPlone',
          'plone.browserlayer',
          # -*- Extra requirements: -*-
      ],
      extras_require = {
          'test': [ 'plone.app.testing>=4.0', ],
      },
      entry_points="""
      # -*- Entry points: -*-
      [z3c.autoinclude.plugin]
      target = plone
      """,
      )

