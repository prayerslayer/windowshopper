// phantomjs cycling through apps
var page = require('webpage').create();
var system = require('system');
var args = system.args;

phantom.onError = function(msg, trace) {
  var msgStack = ['PHANTOM ERROR: ' + msg];
  if (trace && trace.length) {
    msgStack.push('TRACE:');
    trace.forEach(function(t) {
      msgStack.push(' -> ' + (t.file || t.sourceURL) + ': ' + t.line + (t.function ? ' (in function ' + t.function +')' : ''));
    });
  }
  console.error(msgStack.join('\n'));
  phantom.exit(1);
};

page.onConsoleMessage = function(msg, lineNum, sourceId) {
  console.log('CONSOLE: ' + msg + ' (from line #' + lineNum + ' in "' + sourceId + '")');
};
page.open(args[2], function() {
    setTimeout(function() {
        var id = args[1];
        page.viewportSize = {
            width: 1920,
            height: 1080
        };
        page.render('images/' + id + '/' + id + '.png');
        page.viewportSize = {
            height: 1136,
            width: 640
        };
        page.render('images/' + id + '/' + id + '-iphone.png');
        phantom.exit();
    }, 5000);
});
