import os
import logging
import time
import urlparse
import tempfile
import sqlite3

import gobject
import gtk
import webkit
from gtk import gdk
import pango





class HistoryItem(object):
    def __init__(self, url):
        self.url = url
        self.title = None
        self.visits = 0
        self.direct_visits = 0


class HistoryStore(object):
    def __init__(self):
        self.items = {}

    def merge(self, s_item):
        try:
            item = self.items[s_item.url]
        except KeyError:
            print "history add item", s_item.url
            self.items[s_item.url] = s_item
            return s_item
        else:
            item.title = s_item.title
            item.visits += s_item.visits
            item.direct_visits += s_item.direct_visits
            print "history old item", s_item.url, item.visits, item.direct_visits
            return item 

history_store = HistoryStore()


class AsyncDownload(object):
    def __init__(self, url, cb):
        self.handle = urllib2.urlopen(url)
        fn = urlparse.urlsplit(url).path
        ext = fn.rsplit('.', 1)[1]
        self.out_file = tempfile.NamedTemporyFile(suffix="."+ext)
        glib.idle_add(self.read)
        self.cb = cb

    def read(self):
        data = self.handle.read(1024)
        if not data: 
            self.cb(self.out_file.name)
            return False
        self.out_file.write(data)
        return True


class FavIcon(gtk.Image):
    def __init__(self):
        gtk.Image.__init__(self)
        self.set_from_stock(gtk.STOCK_FILE, gtk.ICON_SIZE_MENU)

    def set_url(self, url):
        self._download = AsyncDownload(url, self._loaded)
        
    def _loaded(self, filename):
        self.set_from_file(filename)
        self.loaded = True


class FavIconStore(object):
    def __init__(self):
        self.icons = {}

    def get_for(self, url):
        favico_url = urlparse.urljoin(url, '/favicon.ico')
        icon = FavIcon(favico_url)
        return icon

fav_icon_store = FavIconStore()


class AddressBar(gtk.HBox):
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


class CompleteWin(gtk.Window):
    def __init__(self, entry):
        self.entry = entry
        gtk.Window.__init__(self, type=gtk.WINDOW_POPUP)

        self.scrolling_win = gtk.ScrolledWindow()
        self.scrolling_win.props.hscrollbar_policy = gtk.POLICY_NEVER
        self.scrolling_win.props.vscrollbar_policy = gtk.POLICY_AUTOMATIC

        self.model = AwesomeTreeModel(entry)
        self.list = gtk.TreeView(self.model)
        self.list.set_enable_search(False)

        self.list_column = gtk.TreeViewColumn('Column 0')
        self.list.append_column(self.list_column)
        self.cell = gtk.CellRendererText()
        self.list_column.pack_start(self.cell, True)
        self.list_column.add_attribute(self.cell, 'text', 0)

        self.list.set_headers_visible(False)

        self.scrolling_win.add(self.list)
        self.add(self.scrolling_win)
        #self.add(self.list)

        entry_rect = entry.get_allocation()
        top_lev_pos = entry.get_toplevel().get_position()
        self.move(entry_rect.x + top_lev_pos[0], entry_rect.y + entry_rect.height + top_lev_pos[1])
        self.set_size_request(entry_rect.width, 300)

        self.show_all()


class AwesomeTreeModel(gtk.GenericTreeModel):
    column_types = (str, str)
    column_names = ['url', 'title']

    def __init__(self, entry):
        gtk.GenericTreeModel.__init__(self)
        self.entry = entry
        #self.entry.connect('key-press-event', self.entry_handle_key_press_event)
        self.search_term = None
        self.items = []

        #self.set_search_term(entry.get_text())

    def set_search_term(self, term):
        print "set term", term
        if term == self.search_term:
            return 

        items = [
            (url, item)
            for url, item in history_store.items.iteritems()
            if (term in url or (item.title and term in item.title))
        ]

        items.sort(key=lambda x: (x[1].direct_visits, x[1].visits))
        
        self.items = items
        print items

    def entry_handle_key_press_event(self, sender, event):
        self.set_search_term(sender.get_text())

    def get_column_names(self):
        return self.column_names[:]

    def on_get_flags(self):
        return gtk.TREE_MODEL_LIST_ONLY


    def on_iter_has_child(self, rowref):
        print "on_iter_has_child", self, rowref
        return False

    def on_iter_parent(self, child):
        print "on_iter_parent", child
        return None

    def on_get_n_columns(self):
        print "on_get_n_colums"
        return len(self.column_types)

    def on_get_column_type(self, n):
        return self.column_types[n]

    def on_get_iter(self, path):
        print "on_get_iter", path
        #self.set_search_term(self.entry.get_text())
        return path[0]

    def on_get_path(self, rowref):
        print "on_get_path", rowref
        return rowref

    def on_get_value(self, rowref, column):
        print "get value", rowref, column
        if column is 0:
            return self.items[rowref][0]
        elif column is 1:
            return self.items[rowref][1]


    def on_iter_next(self, rowref):
        print "on_iter_next", rowref
        if rowref + 1 < len(self.items):
            return rowref + 1

    def on_iter_children(self, rowref):
        print "on_iter_children"
        if rowref:
            return None
        return None

    def on_iter_has_child(self, rowref):
        print "on_iter_has_child", rowref
        return False

    def on_iter_n_children(self, rowref):
        print "n children", rowref
        if rowref:
            return 0
        return len(self.items)

    def on_iter_nth_child(self, rowref, n):
        print "on_iter_nth_child", rowref, n
        if rowref:
            return None
        return n

    def on_iter_parent(self, child):
        print "on_iter_parent", child
        return None






def match_func(completion, key_string, iter, func_data):
    return True


class BrowserPage(gtk.VBox):
    def __init__(self):
        gtk.VBox.__init__(self, spacing=4)

        self.hovering_url = None
        self.current_url = None
        self.history_item = None
        self.next_history_direct = False
        self.set_history_title = False
        self.address_entry_popup = None

        self.browser = webkit.WebView()
        self.browser.connect('button-press-event', self.browser_handle_button_press_event)
        self.browser.connect('hovering-over-link', self.browser_handle_hovering_over_link)
        self.browser.connect('title-changed', self.browser_handle_title_changed)
        #self.browser.connect('resource-request-starting', self.browser_handle_resource_request_starting)
        self.browser.connect('load-committed', self.browser_handle_load_committed)
        self.browser.connect('load-finished', self.browser_handle_load_finished)
        #self.browser.connect('icon-loaded', self.browser_handle_icon_loaded)
        self.browser.connect('load-progress-changed', self.browser_handle_load_progress_changed)
        self.browser.connect('navigation-requested', self.browser_handle_navigation_requested)

        #self.address_entry = gtk.Entry()
        #self.address_entry.set_has_frame(False)
        #self.address_entry.set_inner_border(None)
        #self.address_entry.set_size_request(-1, 25)
        #self.address_entry.connect('activate', self.address_entry_handle_activate)
        #self.address_entry.connect('focus-in-event', self.address_entry_handle_focus)
        #self.address_entry.connect('focus-out-event', self.address_entry_handle_focus_out_event)
        #self.address_entry.connect('button-press-event', self.address_entry_handle_button_press_event)
        #self.address_completion = gtk.EntryCompletion()
        #self.address_completion.set_match_func(match_func, None)   
        self.address_completion_store = AwesomeTreeModel(None) #self.address_entry)
        #self.address_completion.set_model(self.address_completion_store)
        #self.address_entry.set_completion(self.address_completion)
        #self.address_completion.set_text_column(0)

        self.address_combo = gtk.ComboBoxEntry(self.address_completion_store, 0)
        self.address_combo.connect('popdown', self.address_combo_handle_popdown)
        self.address_combo.connect('popup', self.address_combo_handle_popup)
        
        self.address_entry = self.address_combo.child
        self.address_entry.connect('activate', self.address_entry_handle_activate)
        self.address_entry.connect('changed', self.address_entry_handle_changed)
        self.address_completion_store.entry = self.address_entry

        self.toolbar = gtk.HBox(spacing=0)
        self.toolbar.pack_start(self.address_combo, fill=True, expand=True, padding=0)

        self.scrolling_win = gtk.ScrolledWindow()
        self.scrolling_win.props.hscrollbar_policy = gtk.POLICY_AUTOMATIC
        self.scrolling_win.props.vscrollbar_policy = gtk.POLICY_AUTOMATIC
        self.scrolling_win.add(self.browser)

        self.pack_start(self.toolbar, fill=False, expand=False, padding=0)
        self.pack_end(self.scrolling_win)

        self.show_all()

    def address_combo_handle_popdown(self, sender):
        print "down", sender
    def address_combo_handle_popup(self, sender):
        print "up", sender
    def address_entry_handle_changed(self, sender):
        print "changed", sender.get_text()
        self.address_completion_store.set_search_term(sender.get_text())

    def open(self, url):
        if url and '://' not in url:
            url = "http://"+url

        if url != self.current_url:
            self.history_item = HistoryItem(url)
            self.history_item.direct_visits += 1

        if url:
            self.browser.open(url)
        else:
            self.emit('title-changed', "(None)")

    def address_entry_handle_activate(self, sender):
        self.open(sender.get_text())

    def address_entry_handle_focus(self, sender, direction):
        self.address_entry.set_position(-1)
        self.address_entry.select_region(0, -1)
        if self.address_entry_popup:
            self.address_entry_popup.destroy()
        self.address_entry_popup = CompleteWin(self.address_entry)

    def address_entry_handle_focus_out_event(self, sender, event):
        self.address_entry.select_region(0, 0)

    def address_entry_handle_button_press_event(self, sender, event):
        if not self.address_entry.is_focus():
            self.address_entry.grab_focus()
            return True

    def browser_handle_navigation_requested(self, browser, frame, request):
        print "nav req", request.get_uri()
        #if request.get_uri() != self.current_url:
        #    self.current_url = request.get_uri()
        #    self.history_item = HistoryItem(request.get_uri())
        return 0 

    def browser_handle_load_progress_changed(self, sender, progress):
        self.address_entry.set_property('progress-fraction', progress / 100.0)

    def browser_handle_icon_loaded(self, *args):
        print "icon loaded", args

    def browser_handle_load_committed(self, browser, frame):
        print "alloc", self.address_entry.get_allocation()
        main_frame = self.browser.get_main_frame()
        if frame is main_frame:
            print "load comit", frame.get_uri()
            #self.history_item = history_store.add(frame.get_uri(), direct=self.next_history_direct)
            if self.current_url != frame.get_uri():
                self.current_url = frame.get_uri()
                if self.history_item is None:
                    self.history_item = HistoryItem(frame.get_uri())
                self.history_item.visits += 1
                self.history_item.url = frame.get_uri()
                self.last_history_item = history_store.merge(self.history_item)
                self.set_history_title = False
                self.history_item = None
            self.address_entry.set_text(frame.get_uri())

    def browser_handle_load_finished(self, browser, frame):
        main_frame = self.browser.get_main_frame()
        if frame is main_frame:
            print "load fin", frame.get_uri(), frame.get_title()
            #self.last_history_item.title = frame.get_title()
        #    history_store.add(frame.get_uri(), frame.get_title())
        pass

    def browser_handle_resource_request_starting(self, browser, frame, resource, request, response):
        print resource, request, response
        print resource.get_uri()

    def browser_handle_button_press_event(self, browser, event):
        if event.state & gdk.CONTROL_MASK or event.button == 2:
            self.emit('open-in-new-window', self.hovering_url)
            return True

    def browser_handle_hovering_over_link(self, view, title, url):
        self.hovering_url = url

    def browser_handle_title_changed(self, view, frame, title):
        self.emit('title-changed', title)
        if not self.set_history_title:
            self.set_history_title = True
            self.last_history_item.title = title 

gobject.signal_new("open-in-new-window", BrowserPage, gobject.SIGNAL_RUN_FIRST,
                   gobject.TYPE_NONE, (gobject.TYPE_STRING, ))
gobject.signal_new("title-changed", BrowserPage, gobject.SIGNAL_RUN_FIRST,
                   gobject.TYPE_NONE, (gobject.TYPE_STRING, ))


class TabLabel(gtk.HBox):
    def __init__(self):
        gtk.HBox.__init__(self)
        self.icon = FavIcon()
        self.label = gtk.Label()
        self.label.set_justify(gtk.JUSTIFY_LEFT)
        self.label.set_max_width_chars(10)
        self.label.set_ellipsize(pango.ELLIPSIZE_END)
        self.pack_start(self.icon, False, False, 1)
        self.pack_start(self.label, False, False, 1)
        self.set_size_request(100, -1)
       
    def set_text(self, text):
        self.label.set_text(text)

    
class Tabs(gtk.Notebook):
    def __init__(self):
        gtk.Notebook.__init__(self)

        self.set_scrollable(True)
        self.set_property('show-tabs', False) 
        self.set_property('tab-border', 0)
        self.set_property('show-border', False)

    def new_page(self, url=None, focus=True):
        page = BrowserPage()
        self.append_page(page)
        page.connect('title-changed', self.tab_handle_title_changed)
        #tab.connect('open-in-new', self.handle_open_in_new)
        self.set_tab_reorderable(page, True)
        page.show_all()

        tab_label = TabLabel()
        self.set_tab_label_packing(page, False, False, gtk.PACK_START)
        self.set_tab_label(page, tab_label)
        tab_label.show_all()

        if self.get_n_pages() > 1:
            self.set_property('show-tabs', True)

        page.open(url)
        if focus:
            self.set_current_page(-1)

    def close_current(self):
        self.remove_page(self.get_current_page())

    def handle_open_in_new(self, sender, url):
        self.new_page(url)

    def tab_label_close_handle_clicked(self, button, page):
        print "close", page

    def tab_label_handle_enter_notify_event(self, sender, event, closebut):
        closebut.show()

    def tab_label_handle_leave_notify_event(self, sender, event, closebut):
        closebut.hide()

    def tab_handle_title_changed(self, page, title):
        tab_label = self.get_tab_label(page)
        tab_label.set_text(title)


class WebBrowser(gtk.Window):

    def __init__(self):
        gtk.Window.__init__(self)

        logging.debug("initializing web browser window")

        self.tabs = Tabs()
        self.tabs.connect('page-added', self.tabs_handle_page_added)

        self.tabs.new_page('http://google.com')
        #self.tabs.new_page('http://xkcd.org')

        vbox = gtk.VBox(spacing=4)
        vbox.pack_start(self.tabs)

        self.add(vbox)
        self.set_default_size(600, 480)

        self.connect('destroy', gtk.main_quit)

        self.connect('key-press-event', self.handle_key_press_event)

        self.show_all()

    def tabs_handle_page_added(self, notebook, page, num):
        page.connect('open-in-new-window', self.page_handle_open_in_new_window)

    def page_handle_open_in_new_window(self, page, url):
        self.tabs.new_page(url)

    def handle_key_press_event(self, sender, event):
        keyname = gdk.keyval_name(event.keyval)
        if keyname == 'w' and event.state & gdk.CONTROL_MASK:
            self.tabs.close_current()
            return True
        elif keyname == 't' and event.state & gdk.CONTROL_MASK:
            self.tabs.new_page()
            return True
        elif keyname == 'q' and event.state & gdk.CONTROL_MASK:
            gtk.main_quit()
            return True
        elif keyname == 'Right' and event.state & gdk.MOD1_MASK:
            self.tabs.next_page()
            return True
        elif keyname == 'Left' and event.state & gdk.MOD1_MASK: 
            self.tabs.prev_page()
            return True 


if __name__ == "__main__":
    webbrowser = WebBrowser()
    gtk.main()

