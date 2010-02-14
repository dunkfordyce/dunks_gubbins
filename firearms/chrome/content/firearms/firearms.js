FBL.ns(function()  { with (FBL) {


var firearmsRep = domplate(
{
    testCaseTable:
        TABLE({class: 'test-case'},
            TBODY(
                TR(
                    TH("command"),
                    TH("target"),
                    TH("value")
                ),
                FOR('command', '$commands',
                    TR(
                        TD('$command.command'),
                        TD('$command.target'),
                        TD('$command.value')
                    )   
                )
            )
        ),

    testCaseRow:
        TR(
            TD("$command"),
            TD("$arguments")
        ),

    myTag:
        DIV({class: "MyDiv"},
            "Hello World!"
        )
});



var panelName = "Firearms";
Firebug.FirearmsModel = extend(Firebug.Module,
{
    addStyleSheet: function(doc) {
        // Make sure the stylesheet isn't appended twice.
        if ($("firearmsStyles", doc))
            return;

        var styleSheet = createStyleSheet(doc,
            "chrome://firearms/skin/firearms.css");
        styleSheet.setAttribute("id", "firearmsStyles");
          addStyleSheet(doc, styleSheet);
    },

    showPanel: function(browser, panel) {
        var isHwPanel = panel && panel.name == panelName;
        var hwButtons = browser.chrome.$("fbFirearmsButtons");
        collapse(hwButtons, !isHwPanel);
    },

    onMyButton: function(context) {
        //var panel = context.getPanel(panelName);
        //var parentNode = panel.panelNode;
        //var rootTemplateElement = firearmsRep.myTag.append(
        //    {}, parentNode, firearmsRep);
        //logFormatted([context], "log");

        var dlog = function() {
            Firebug.Console.logFormatted(arguments, context, "log", null, null);
        };
        dlog(context);

        var panel = context.getPanel(panelName);
        var state = getPersistedState(context, panelName);
        //state.editor.sdebugger.start();

        var editor = state.editor;
        
            editor.testCase = editor.format.load();

            //var panel = context.getPanel(panelName);
            //var parentNode = panel.panelNode;
            //var rootTemplateElement = firearmsRep.myTag.append({}, parentNode, firearmsRep);
            //dlog('tag', panel, parentNode, rootTemplateElement);

            panel.initLayout();

            //editor.testCase.commands.forEach(function(command, idx) {
            //    var row = firearmsRep.testCaseRow.append(
            //        {command: 'command', 'arguments': 'args'},
            //        panel.table.children[0], firearmsRep);
            //    dlog(row);
            //});
            panel.table = firearmsRep.testCaseTable.append(
                    {commands: editor.testCase.commands},
                    panel.panelNode, firearmsRep);

            dlog('tc', editor.testCase);
            editor.testSuite = new TestSuite();
            editor.testSuite.addTestCaseFromContent(editor.testCase);
            dlog('ts', editor.testSuite);

        /*
        firearms.log = dlog;
        Firebug.Console.logFormatted([context, context.global], context, "log", null, null);
        var tc = new firearms.test.TestCase([
            'jQuery.log($("input[type=text]"));',
            //'$("input[type=text]").val("boob")',
            //'$("input[type=submit]").click()',
            //'$.log($.test.context.window)',
            //'$($.test.context.window).unload(function(){ alert("close");})'
        ]);
        tc.run(context.window);
        ddd('done');
        Firebug.Console.logFormatted([FBL], context, "log", null, null);
        Firebug.Console.logFormatted([Firebug], context, "log", null, null);
        var tc = new TestCase([
            '$("input[type=submit]").click()',
            'waitFor("body", "load");'
        ]);
        Firebug.Console.logFormatted([pb, tc], context, "log", null, null);
        tc.run(pb);
        //var el = pb.find('body');
        //Firebug.Console.logFormatted([el], context, "log", null, null);
        //el = pb.find('input[type=submit]');
        //Firebug.Console.logFormatted([el], context, "log", null, null);
        //el.click();
        */
    }
});

var gcontext = null;

var glog = function() {
    ddd('ddd', arguments);
    Firebug.Console.logFormatted(arguments, gcontext, "log", null, null);
};


function FirearmsPanel() {}
FirearmsPanel.prototype = extend(Firebug.Panel,
{
    name: panelName,
    title: "Hello World!",

    initialize: function(context) {
        Firebug.Panel.initialize.apply(this, arguments);
        Firebug.FirearmsModel.addStyleSheet(this.document);

        var dlog = function() {
            Firebug.Console.logFormatted(arguments, context, "log", null, null);
        };

        dlog('init', arguments);
        gcontext = context;

        var state = getPersistedState(context, panelName);

        
    
        if( !state.editor ) {
            state.editor = {
                testCase: null,
                testSuite: null,    
                options: null,

                app: {
                    addObserver: function() {
                        dlog("addObserver", arguments);
                    }
                },
            
                infoPanel: {
                    logView: {
                        setLog: function(log) {
                            dlog('setLog', arguments);
                            log.log = function(msg, level) {
                                dlog('log', level, msg);
                            }
                        }
                    }
                },

                view: {
                    rowUpdated: function() {
                        dlog('rowUpdated', arguments);
                    },
                    scrollToRow: function() {
                        dlog('scrollToRow', arguments);
                    }
                },

                toggleRecordingEnabled: function() {
                    dlog("togglerecordingenbable", arguments);
                },
            
                getTestCase: function() {
                    return this.testCase;
                },

                getOptions: function() {
                    return this.options;
                },

                getInterval: function() {
                    return 500;
                },

                getBaseURL: function() {
                    return 'http://localhost:5002';
                }
            };

            var editor = state.editor;

            editor.options = SeleniumIDE.Preferences.load();
            dlog('options', editor.options);
            editor.formats = new FormatCollection(editor.options);
            dlog('formats', editor.formats);
            editor.format = editor.formats.selectFormat(null);
            dlog('format', editor.format);

            editor.sdebugger = new Debugger(editor);
        }
        dlog('state', state);
        dlog('context', context);
    }, 

    initLayout: function() {
        return;
        glog('initlayout');
        if( !this.table ) {
            this.table = firearmsRep.testCaseTable.append({}, this.panelNode, firearmsRep);
            glog('table', this.table);
        }
    },

    show: function(state) {
        glog('show', state);
        this.initLayout();
    }
});

Firebug.registerModule(Firebug.FirearmsModel);
Firebug.registerPanel(FirearmsPanel); 

}});
