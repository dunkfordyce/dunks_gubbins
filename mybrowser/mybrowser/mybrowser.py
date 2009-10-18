import os
import logging
import time
from gettext import gettext as _

import gobject
import gtk
import webkit


class BrowserPage(webkit.WebView):

    def __init__(self):
        webkit.WebView.__init__(self)


class WebStatusBar(gtk.Statusbar):

    def __init__(self):
        gtk.Statusbar.__init__(self)
        self.iconbox = gtk.EventBox()
        self.iconbox.add(gtk.image_new_from_stock(gtk.STOCK_INFO,
                                                  gtk.ICON_SIZE_BUTTON))
        self.pack_start(self.iconbox, False, False, 6)
        self.iconbox.hide_all()

    def display(self, text, context=None):
        cid = self.get_context_id("pywebkitgtk")
        self.push(cid, str(text))

    def show_javascript_info(self):
        self.iconbox.show()

    def hide_javascript_info(self):
        self.iconbox.hide()


all_signals = [
    "close-web-view",
    "console-message",
    "copy-clipboard",
    "create-plugin-widget",
    "create-web-view",
    "cut-clipboard",
    "database-quota-exceeded",
    "download-requested",
    "hovering-over-link",
    "icon-loaded",
    "load-committed",
    "load-error",
    "load-finished",
    "load-progress-changed",
    "load-started",
    "mime-type-policy-decision-requested",
    "move-cursor",
    "navigation-policy-decision-requested",
    "navigation-requested",
    "new-window-policy-decision-requested",
    "paste-clipboard",
    "populate-popup",
    "print-requested",
    "redo",
    "resource-request-starting",
    "script-alert",
    "script-confirm",
    "script-prompt",
    "select-all",
    "selection-changed",
    "set-scroll-adjustments",
    "status-bar-text-changed",
    "title-changed",
    "undo",
    "web-view-ready",
    "window-object-cleared",
]


class WebKitTab(gtk.ScrolledWindow):
    def __init__(self, url=None):
        gtk.ScrolledWindow.__init__(self)

        self.props.hscrollbar_policy = gtk.POLICY_AUTOMATIC
        self.props.vscrollbar_policy = gtk.POLICY_AUTOMATIC
        
        self._loading = False
        self._browser= BrowserPage()
        self.open_in_new_tab = False
        #self._browser.connect('load-started', self._loading_start_cb)
        #self._browser.connect('load-committed', self._load_committed)
        #self._browser.connect('load-progress-changed',
        #                      self._loading_progress_cb)
        #self._browser.connect('load-finished', self._loading_stop_cb)
        #self._browser.connect("title-changed", self._title_changed_cb)
        #self._browser.connect("hovering-over-link", self._hover_link_cb)
        #self._browser.connect("status-bar-text-changed",
        #                      self._statusbar_text_changed_cb)
        #self._browser.connect("icon-loaded", self._icon_loaded_cb)
        #self._browser.connect("selection-changed", self._selection_changed_cb)
        #self._browser.connect("set-scroll-adjustments",
        #                      self._set_scroll_adjustments_cb)
        #self._browser.connect("populate-popup", self._populate_popup)

        #self._browser.connect("console-message",
        #                      self._javascript_console_message_cb)
        #self._browser.connect("script-alert",
        #                      self._javascript_script_alert_cb)
        #self._browser.connect("script-confirm",
        #                      self._javascript_script_confirm_cb)
        #self._browser.connect("script-prompt",
        #                      self._javascript_script_prompt_cb)

        for signal in all_signals:
            f = getattr(self, "handle_" + signal.replace('-', '_'), None)
            if not f:
                def w(sig):
                    def f(*args):
                        print "unhandled signal", sig, args
                    return f
                f = w(signal)

            try:
                self._browser.connect(signal, f)
            except TypeError, e:
                print "err", e

        self._browser.connect('button-press-event', self.handle_button_press_event)

        if url:
            self.open(url)

        self.url = url

        self.add(self._browser)
        self.show_all()

    def handle_button_press_event(self, view, event):
        if event.button == 2:
            self.emit("open-in-new", self.hovering_url)
            return True

    def handle_navigation_requested(self, view, frame, request):
        print "request", request.get_uri()
        print request, dir(request)
        if self.open_in_new_tab:
            print "open in new!"
            self.emit("open-in-new", request.get_uri())
            return 1
        return 0 

    def handle_hovering_over_link(self, view, title, url):
        self.hovering_url = url
        self.set_status(url)

    def open(self, url):
        self.emit_uri_changed(url)
        self._browser.open(url)

    def emit_uri_changed(self, uri):
        print "uri-changed emit", uri, type(uri)
        self.url = uri
        self.emit('uri-changed', uri)

    def set_status(self, message):
        self.emit('status-changed', message)

    def _set_title(self, title):
        self.emit('title-changed', title)

    def _loading_start_cb(self, view, frame):
        main_frame = self._browser.get_main_frame()
        if frame is main_frame:
            self._set_title("Loading...")
            
        #self._toolbar.set_loading(True)

    def _load_committed(self, view, frame):
        main_frame = self._browser.get_main_frame()
        if frame is main_frame:
            current_url = frame.get_uri()
            self._set_title("Loading %s..." % current_url)
            if current_url != self.url:
                self.emit_uri_changed(current_url)

    def _loading_stop_cb(self, view, frame):
        # FIXME: another frame may still be loading?
        #self._toolbar.set_loading(False)
        main_frame = self._browser.get_main_frame()
        current_url = main_frame.get_uri()
        if self.url != current_url:
            self.emit_uri_changed(current_url)

    def _loading_progress_cb(self, view, progress):
        self.set_status(_("%s%s loaded") % (progress, '%'))
        main_frame = self._browser.get_main_frame()
        print "loading", main_frame.get_uri()

    def _title_changed_cb(self, widget, frame, title):
        self._set_title(_("%s") % title)

    def _hover_link_cb(self, view, title, url):
        if view and url:
            self.set_status(url)
        else:
            self.set_status('')

    def _statusbar_text_changed_cb(self, view, text):
        #if text:
        self.set_status(text)

    def _icon_loaded_cb(self):
        print "icon loaded"

    def _selection_changed_cb(self):
        print "selection changed"

    def _set_scroll_adjustments_cb(self, view, hadjustment, vadjustment):
        self.props.hadjustment = hadjustment
        self.props.vadjustment = vadjustment

    def _navigation_requested_cb(self, view, frame, networkRequest):
        print networkRequest, dir(networkRequest)
        self.emit_uri_changed(networdRequest.get_uri())
        return 1

    def _javascript_console_message_cb(self, view, message, line, sourceid):
        self._statusbar.show_javascript_info()

    def _javascript_script_alert_cb(self, view, frame, message):
        pass

    def _javascript_script_confirm_cb(self, view, frame, message, isConfirmed):
        pass

    def _javascript_script_prompt_cb(self, view, frame,
                                     message, default, text):
        pass

    def _populate_popup(self, view, menu):
        aboutitem = gtk.MenuItem(label="About PyWebKit")
        menu.append(aboutitem)
        aboutitem.connect('activate', self._about_pywebkitgtk_cb)
        menu.show_all()

    def _about_pywebkitgtk_cb(self, widget):
        self._browser.open("http://live.gnome.org/PyWebKitGtk")


gobject.signal_new("status-changed", WebKitTab, gobject.SIGNAL_RUN_FIRST,
                   gobject.TYPE_NONE, (gobject.TYPE_STRING, ))
gobject.signal_new("title-changed", WebKitTab, gobject.SIGNAL_RUN_FIRST,
                   gobject.TYPE_NONE, (gobject.TYPE_STRING, ))
gobject.signal_new("uri-changed", WebKitTab, gobject.SIGNAL_RUN_FIRST,
                   gobject.TYPE_NONE, (gobject.TYPE_STRING, ))
gobject.signal_new("open-in-new", WebKitTab, gobject.SIGNAL_RUN_FIRST,
                   gobject.TYPE_NONE, (gobject.TYPE_STRING, ))


class Toolbar(gtk.HBox):
    def __init__(self):
        gtk.HBox.__init__(self)
        self.address_entry = gtk.Entry()
        self.address_entry.connect('activate', self._address_entry_activate)

        self.address_completion = gtk.EntryCompletion()
        self.address_completion_store = gtk.ListStore(str)
        for s in ('http://google.com', 'http://fatdrop.co.uk'):
            self.address_completion_store.append([s])
        self.address_completion.set_model(self.address_completion_store)
        self.address_entry.set_completion(self.address_completion)
        self.address_completion.set_text_column(0)

        self.pack_start(self.address_entry)

    def _uri_changed(self, sender, uri):
        print "uri", uri
        self.address_entry.set_text(uri)

    def _address_entry_activate(self, sender):
        self.emit('request-uri-change', sender.get_text())

gobject.signal_new("request-uri-change", Toolbar, gobject.SIGNAL_RUN_FIRST,
                   gobject.TYPE_NONE, (gobject.TYPE_STRING, ))

class Tab(gtk.VBox):
    def __init__(self, url=None):
        gtk.VBox.__init__(self, spacing=4)

        self.browser = WebKitTab(url=url)
        self.toolbar = Toolbar()
        self.statusbar = WebStatusBar()
        self.pack_start(self.toolbar, fill=False, expand=False)
        self.pack_start(self.browser)
        self.pack_end(self.statusbar, fill=False, expand=False)

        self.browser.connect('uri-changed', self._uri_changed)
        self.browser.connect('status-changed', self._status_change)
        self.browser.connect('title-changed', self._title_change)
        self.browser.connect('open-in-new', self.handle_open_in_new)

        self.connect('uri-changed', self.toolbar._uri_changed)
        if url:
            self._uri_changed(self, url)

        self.toolbar.connect('request-uri-change', self._toolbar_request_uri_change)

        self.connect('key-press-event', self.handle_key_press_event)
        self.connect('key-release-event', self.handle_key_release_event)

    def handle_open_in_new(self, sender, url):
        self.emit('open-in-new', url)

    def handle_key_press_event(self, sender, event):
        print "press", sender, event
        self.browser.open_in_new_tab = True

    def handle_key_release_event(self, sender, event):
        print "release", sender, event
        self.browser.open_in_new_tab = False

    def _toolbar_request_uri_change(self, sender, uri):
        self.browser.open(uri)

    def _uri_changed(self, sender, uri):
        self.emit('uri-changed', uri)

    def _status_change(self, sender, status):
        self.statusbar.display(status)

    def _title_change(self, sender, title):
        self.emit('title-changed', title)
            
gobject.signal_new("title-changed", Tab, gobject.SIGNAL_RUN_FIRST,
                   gobject.TYPE_NONE, (gobject.TYPE_STRING, ))
gobject.signal_new("uri-changed", Tab, gobject.SIGNAL_RUN_FIRST,
                   gobject.TYPE_NONE, (gobject.TYPE_STRING, ))
gobject.signal_new("open-in-new", Tab, gobject.SIGNAL_RUN_FIRST,
                   gobject.TYPE_NONE, (gobject.TYPE_STRING, ))


class Tabs(gtk.Notebook):
    def __init__(self):
        gtk.Notebook.__init__(self)

        self.set_scrollable(True)
        self.popup_enable()

        self.connect('switch-page', self._switch_page)

    def add_tab(self, url=None):
        tab = Tab(url=url)
        self.append_page(tab)
        tab.connect('title-changed', self._set_title)
        tab.connect('open-in-new', self.handle_open_in_new)
        self.set_tab_reorderable(tab, True)
        tab.show_all()

    def handle_open_in_new(self, sender, url):
        self.add_tab(url)

    def _switch_page(self, notebook, page, page_num):
        self.current_page = self.get_nth_page(page_num)

    def _set_title(self, sender, msg):
        self.set_tab_label_text(sender, msg)
            
gobject.signal_new("status-changed", Tabs, gobject.SIGNAL_RUN_FIRST,
                   gobject.TYPE_NONE, (gobject.TYPE_STRING, ))


class WebBrowser(gtk.Window):

    def __init__(self):
        gtk.Window.__init__(self)

        logging.debug("initializing web browser window")

        self._tabs = Tabs()
        self._tabs.add_tab('http://google.com')
        self._tabs.add_tab('http://xkcd.org')

        vbox = gtk.VBox(spacing=4)
        vbox.pack_start(self._tabs)

        self.add(vbox)
        self.set_default_size(600, 480)

        self.connect('destroy', gtk.main_quit)

        about = """
<html><head><title>About</title></head><body>
<h1>Welcome to <code>webbrowser.py</code></h1>
<p><a href="http://google.com">Homepage</a></p>
</body></html>
"""
        #self._browser.load_string(about, "text/html", "iso-8859-15", "about:")

        self.show_all()


if __name__ == "__main__":
    webbrowser = WebBrowser()
    gtk.main()
