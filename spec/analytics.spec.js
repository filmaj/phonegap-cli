var cli = require('../lib/cli');
var analytics = require('../lib/cli/analytics');
var request = require('request');

function trigger_phonegap_cli() {
    require('../bin/phonegap');
}

describe('PhoneGap Analytics', function() {
    beforeEach(function() {
        // ensure we dont prompt for turning analytics on
        spyOn(cli.prototype.analytics, 'statusUnknown').andReturn(false);
    });
    it('should pass error objects from command invocations to analytics', function() {
        var fake_error = {message: 'yo dawg'};
        var track = spyOn(cli.prototype.analytics, 'trackEvent');
        spyOn(cli.prototype, 'argv').andCallFake(function(argv, cb) {
            cb(fake_error);
        });
        trigger_phonegap_cli();
        expect(track).toHaveBeenCalledWith(jasmine.any(Array), fake_error);
    });
    describe('trackEvent', function() {
        var post_spy;
        var get_spy;
        var set_spy;
        beforeEach(function() {
            spyOn(analytics, 'hasOptedOut').andReturn(false);
            post_spy = spyOn(request, 'post');
            get_spy = spyOn(analytics.config, 'get');
            set_spy = spyOn(analytics.config, 'set');
        });
        it('should POST to metrics.phonegap.com on successfully-parsed commands', function() {
            analytics.trackEvent(["platform", "list"]);
            expect(post_spy).toHaveBeenCalled();
        });
        it('should attach command exit codes to event tracking', function() {
            analytics.trackEvent(["platform", "explode"], {exitCode:21});
            var dump = JSON.parse(post_spy.calls[0].args[0].form);
            expect(dump._exitCode).toEqual(21);
        });
        it('should track top-level commands in the short_message event field', function() {
            var cmds = ['serve', 'platform', 'plugins', 'version'];
            cmds.forEach(function(cmd) {
                analytics.trackEvent([cmd]);
                var last_call = post_spy.calls[post_spy.calls.length - 1];
                var dump = JSON.parse(last_call.args[0].form);
                expect(dump.short_message).toEqual(cmd);
            });
        });
        it('should track switches in the _switches event field', function() {
            var cmd = ['serve', '--yourself', '--verbose'];
            analytics.trackEvent(cmd);
            var dump = JSON.parse(post_spy.calls[0].args[0].form);
            expect(dump._flags).toContain('--yourself');
            expect(dump._flags).toContain('--verbose');
        });
        it('should track parameters in the _params event field', function() {
            var cmd = ['plugins', 'list'];
            analytics.trackEvent(cmd);
            var dump = JSON.parse(post_spy.calls[0].args[0].form);
            expect(dump._params).toContain('list');
        });
        describe('session tracking', function() {
            it('should tag events with a session id', function() {
                var cmd = ['plugins', 'list'];
                analytics.trackEvent(cmd);
                var dump = JSON.parse(post_spy.calls[0].args[0].form);
                expect(dump._session).toEqual(jasmine.any(String));
            });
            it('should tag events with the same session ID if consecutive commands are issued within the event expiry time', function() {
                get_spy.andCallFake(function(key) {
                    if (key == 'lastRun') {
                        return (new Date().valueOf() - analytics.EVENT_EXPIRY_TIME + 1);
                    } else if (key == 'lastSession') {
                        return "holygrail";
                    }
                });
                var cmd = ['plugins', 'list'];
                analytics.trackEvent(cmd);
                var dump = JSON.parse(post_spy.calls[0].args[0].form);
                expect(dump._session).toEqual("holygrail");
            });
            it('should tag events with a new session ID if consecutive commands are issued outside the event expiry time', function() {
                get_spy.andCallFake(function(key) {
                    if (key == 'lastRun') {
                        return (new Date().valueOf() - (2 * analytics.EVENT_EXPIRY_TIME));
                    } else if (key == 'lastSession') {
                        return "holygrail";
                    }
                });
                var cmd = ['plugins', 'list'];
                analytics.trackEvent(cmd);
                var dump = JSON.parse(post_spy.calls[0].args[0].form);
                expect(dump._session).not.toEqual("holygrail");
                expect(set_spy).toHaveBeenCalledWith('lastSession', jasmine.any(String));
            });
            it('should always keep track of the last run', function() {
                var now = new Date().valueOf();
                var cmd = ['plugins', 'list'];
                analytics.trackEvent(cmd);
                expect(set_spy).toHaveBeenCalledWith('lastRun', jasmine.any(Number));
                expect(set_spy.calls[set_spy.calls.length - 1].args[1]).toEqual(now);
            });
        });
    });
});
