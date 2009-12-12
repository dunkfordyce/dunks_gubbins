
in ~/.vimperatorrc add following line:
    command! ts -nargs=? :js tooomanytabs.filter.filter('<args>')

then you can:
    :ts <your filter string>

and to clear the filter:
    :ts

