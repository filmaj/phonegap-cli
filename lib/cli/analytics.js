/*
command: phonegap analytics

when: user has opted in
result: outputs message "Analytics is enabled! Nice, you are helping us make phonegap tooling better."
"If you would like to turn analytics off, simply run `phonegap analytics off`

when: user has opted out
result: outputs message "Analytics is off. If you would like to enable analytics simply run `phonegap analytics on`"

when: user has not specified anything yet
result: user is presented with y/n option to explicitely turn it on or off

commands:
phonegap analytics reset|on|off
*/

var Insight = require('insight');
var fs = require('fs');
var path = require('path');
var request = require('request');
var sanitizeArgs = require('./util/sanitize-args');
var os_name = require('os-name');

// Google Analytics tracking code
var trackingCode = 'UA-94271-37'; // this is the default production tracking code

var rootPath = require.resolve('../../package.json');
var gitPath = path.join(path.dirname(rootPath),'.git');
if(fs.existsSync(gitPath)) {
    // set it to the dev tracking code
    trackingCode = 'UA-94271-38';
}

var insight = new Insight({
    "trackingCode": trackingCode,
    "pkg": require('../../package.json')
});

var category = 'phonegap@' + require('../../package.json').version;

var PromptPreamble = '\nHow you use PhoneGap provides us with important data that we can use to make\n' +
                     'our products better. Please read our privacy policy for more information on the\n' +
                     'data we collect. http://www.adobe.com/privacy.html';
var PromptMessage = 'Would you like to allow PhoneGap to collect anonymous usage data?';
var UserAcceptedMessage = '\nThank you for helping to make PhoneGap better.\n';
var UserDeclinedMessage = '\nYou have opted out of analytics. To change this, run: `phonegap analytics on`\n';
var AnalyticsOffMessage  = '\nAnalytics is off. \nIf you would like to turn analytics on, simply run `phonegap analytics on`\n';
var AnalyticsOnMessage  = '\nAnalytics is on! Nice, you are helping us improve PhoneGap tooling.\n' +
                         'If you would like to turn analytics off, simply run `phonegap analytics off`\n';

/*
    Helper function to determine if cli is a production/dev release
*/

function getDebugFlag() {
    if(/cordova/.test(category)) {
        return true;
    } else {
        return false;
    }
}

/*
    Helper function to help build up GELF formatted json
    TODO: how does GA session vs. user id work?
    below seems to track user w/ session
*/

function basicGELF() {
    return {
        "version": "1.1",
        "host": "cli",
        "short_message": "",
        "_userID": insight.clientId,
        "_appVersion": require('../../package.json').version,
        "_nodeVersion": process.version,
        "_platform": os_name(),
        "_env": getDebugFlag() ? 1 : 0
    };
}

/*
    Helper function to send events to the analytics end point
*/
function sendAnalytics(data) {
    if (!data) return;

    request.post({
        url: 'https://metrics.phonegap.com/gelf',
        form: JSON.stringify(data)
    }, function(err, res, body) {
        // TODO: do we want to report errors to somewhere???
    });
}

module.exports.prompt = function prompt(callback) {
    console.log(PromptPreamble);

    insight.askPermission(PromptMessage,function(error,optIn) {
        if (optIn) {
            // user has accepted, we will thank them and track this
            insight.trackEvent({"category":"analytics-prompt",
                                "action":"accepted",
                                "label":""});

            var info = basicGELF();
            info.short_message = "analytics-prompt accepted";
            sendAnalytics(info);

            console.log(AnalyticsOnMessage);
        }
        else {
            // user has declined, we still want to track this
            insight.optOut = false;
            insight.trackEvent({"category":"analytics-prompt",
                                "action":"declined",
                                "label":""});

            var info = basicGELF();
            info.short_message = "analytics-prompt declined";
            sendAnalytics(info);

            insight.optOut = true;
            console.log(AnalyticsOffMessage);
        }
        callback();
    });
};

module.exports.statusUnknown = function statusUnknown() {
    return insight.optOut === undefined;
};

module.exports.trackEvent = function trackEvent(args, error) {
    // if we received an error, then we will exit with an error status
    // if an exit code was attached to the error, then use it
    // otherwise default to 1.
    var exitCode = error ? error.exitCode || 1 : 0;
    var all_parameters = args.slice(2);
    var cleanedResult = sanitizeArgs.stringifyForGoogleAnalytics(all_parameters);
    var category = cleanedResult.command;
    var action = cleanedResult.params;
    var label = exitCode + "";
    var value = cleanedResult.count;
    if (insight.optOut === false) {
        if (category) {
            var info = basicGELF();
            info.short_message = sanitizeArgs.getCommand(all_parameters);
            info._flags = sanitizeArgs.getSwitches(all_parameters);
            info._exitCode = exitCode;
            info._params = sanitizeArgs.filterParameters(all_parameters);
            // TODO: should we attach the error object here if it exists?
            sendAnalytics(info);
        }
        category = category || "-";
        action = action || "-";
        label = label || "-";
        value = value || 0;
        insight.trackEvent({"category":category,
                            "action":action,
                            "label":label,
                            "value":value});
    }
};
