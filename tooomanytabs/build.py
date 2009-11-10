import subprocess
import os


def run():
    if not os.path.exists('dist'):
        os.mkdir('dist')
    target = 'dist/tooomanytabs@dunkfordyce.xpi'
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
