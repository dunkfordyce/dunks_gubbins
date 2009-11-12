import subprocess
import os

from xml.etree import ElementTree


def run():
    if not os.path.exists('dist'):
        os.mkdir('dist')

    install_rdf = ElementTree.fromstring(open('install.rdf').read())
    version = install_rdf.find('.//{http://www.mozilla.org/2004/em-rdf#}version').text

    target = 'dist/tooomanytabs@dunkfordyce-%s.xpi' % version

    if os.path.exists(target):
        os.unlink(target)
    subprocess.call([
        'zip',
        '-r',
        target,
        'install.rdf',
        'chrome.manifest',
        'chrome',
        'defaults',
        '-x',
        '*.sw?',
    ])


if __name__ == '__main__':
    run()
