import os
import logging
import time

import gobject
import gtk
import webkit
from gtk import gdk
import pango

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


class BrowserPage(gtk.VBox):
    def __init__(self):
        gtk.VBox.__init__(self, spacing=4)

        self.hovering_url = None

        self.browser = webkit.WebView()
        self.browser.connect('button-press-event', self.browser_handle_button_press_event)
        self.browser.connect('hovering-over-link', self.browser_handle_hovering_over_link)
        self.browser.connect('title-changed', self.browser_handle_title_changed)
        #self.browser.connect('resource-request-starting', self.browser_handle_resource_request_starting)
        self.browser.connect('load-finished', self.browser_handle_load_finished)

        self.address_entry = gtk.Entry()
        self.address_entry.connect('activate', self.address_entry_handle_activate)

        self.toolbar = gtk.HBox()
        self.toolbar.pack_start(self.address_entry)

        self.scrolling_win = gtk.ScrolledWindow()
        self.scrolling_win.props.hscrollbar_policy = gtk.POLICY_AUTOMATIC
        self.scrolling_win.props.vscrollbar_policy = gtk.POLICY_AUTOMATIC
        self.scrolling_win.add(self.browser)

        self.pack_start(self.toolbar, fill=False, expand=False)
        self.pack_end(self.scrolling_win)

        self.show_all()

    def open(self, url):
        if url:
            self.browser.open(url)
        else:
            self.emit('title-changed', "(None)")

    def address_entry_handle_activate(self, sender):
        self.open(sender.get_text())

    def browser_handle_load_finished(self, browser, frame):
        print dir(frame)
        print frame.notify
        print frame.props

    def browser_handle_resource_request_starting(self, *args):
        print args

    def browser_handle_button_press_event(self, browser, event):
        if event.state & gdk.CONTROL_MASK or event.button == 2:
            self.emit('open-in-new-window', self.hovering_url)
            return True

    def browser_handle_hovering_over_link(self, view, title, url):
        self.hovering_url = url

    def browser_handle_title_changed(self, view, frame, title):
        self.emit('title-changed', title)

gobject.signal_new("open-in-new-window", BrowserPage, gobject.SIGNAL_RUN_FIRST,
                   gobject.TYPE_NONE, (gobject.TYPE_STRING, ))
gobject.signal_new("title-changed", BrowserPage, gobject.SIGNAL_RUN_FIRST,
                   gobject.TYPE_NONE, (gobject.TYPE_STRING, ))


class TabLabel(gtk.HBox):
    def __init__(self):
        gtk.HBox.__init__(self)
        self.label = gtk.Label()
        self.label.set_justify(gtk.JUSTIFY_LEFT)
        self.label.set_max_width_chars(10)
        self.label.set_ellipsize(pango.ELLIPSIZE_END)
        self.pack_start(self.label, False, False)
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
        print "enter"
        closebut.show()

    def tab_label_handle_leave_notify_event(self, sender, event, closebut):
        print "leave"
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
        self.tabs.new_page('http://xkcd.org')

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


if __name__ == "__main__":
    webbrowser = WebBrowser()
    gtk.main()



class MyNotebook(gtk.Notebook):

  def __init__(self):
    gtk.Notebook.__init__(self)
    #set the tab properties
    self.set_property('homogeneous', True)
    #we do not show the tab if there is only one tab i total
    self.set_property('show-tabs', False) 

  def new_tab(self):
    #we create a "Random" image to put in the tab
    icons = [gtk.STOCK_ABOUT, gtk.STOCK_ADD, gtk.STOCK_APPLY, gtk.STOCK_BOLD] 
    image = gtk.Image()
    nbpages = self.get_n_pages()
    icon = icons[nbpages%len(icons)]
    image.set_from_stock(icon, gtk.ICON_SIZE_DIALOG)
    self.append_page(image)
    
    #we want to show the tabs if there is more than 1
    if nbpages + 1 > 1:
      self.set_property('show-tabs', True)
    #creation of a custom tab. the left image and
    #the title are made of the stock icon name
    #we pass the child of the tab so we can find the
    #tab back upon closure
    label = self.create_tab_label(icon, image)
    label.show_all()
    
    self.set_tab_label_packing(image, True, True, gtk.PACK_START)
    self.set_tab_label(image, label)
    image.show_all()
    self.set_current_page(nbpages)

  def create_tab_label(self, title, tab_child):
    box = gtk.HBox()
    icon = gtk.Image()
    icon.set_from_stock(title, gtk.ICON_SIZE_MENU)
    label = gtk.Label(title)
    closebtn = gtk.Button()
    #the close button is made of an empty button
    #where we set an image
    image = gtk.Image()
    image.set_from_stock(gtk.STOCK_CLOSE, gtk.ICON_SIZE_MENU)
    closebtn.connect("clicked", self.close_tab, tab_child)
    closebtn.set_image(image)
    closebtn.set_relief(gtk.RELIEF_NONE)
    box.pack_start(icon, False, False)
    box.pack_start(label, True, True)
    box.pack_end(closebtn, False, False)
    return box

  def close_tab(self, widget, child):
    pagenum = self.page_num(child)
    
    if pagenum != -1:
      self.remove_page(pagenum)
      child.destroy()
      if self.get_n_pages() == 1:
        self.set_property('show-tabs', False)    
    
def on_destroy(win):
  gtk.main_quit()

def on_delete_event(widget, event):
  gtk.main_quit()

def new_tab(widget):
  notebook.new_tab()

if __name__ == '__main__':
  
  window = gtk.Window()
  window.set_title("Custom Gtk.Notebook Tabs example")
  window.resize(600,400)
  box = gtk.VBox()
  button = gtk.Button("New Tab")
  box.pack_start(button,False)
  button.connect("clicked", new_tab)
  notebook = MyNotebook()
  box.pack_start(notebook)
  window.add(box)
  window.connect("destroy", on_destroy)
  window.connect("delete-event", on_delete_event)
  window.show_all()
  gtk.main()
  sys.exit(0)

