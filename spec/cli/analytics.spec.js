/*
 * Module dependencies.
 */

var argv,
    cli,
    stdout,
    rewire = require('rewire'),
    analytics = rewire('../../lib/cli/analytics'),
    CLI = require('../../lib/cli'),
    request = require('request');

/*
 * Specification: $ phonegap help analytics
 */

describe('phonegap help analytics', function() {
    beforeEach(function() {
        cli = new CLI();
        argv = ['node', '/usr/local/bin/phonegap'];
        spyOn(cli, 'analytics');
        spyOn(process.stdout, 'write');
        spyOn(process.stderr, 'write');
        stdout = process.stdout.write;
    });

    describe('$ phonegap analytics help', function() {
        it('should output usage info', function() {
            cli.argv(argv.concat(['analytics', 'help']));
            expect(stdout.calls.mostRecent().args[0]).toMatch(/usage: [\S]+ analytics/i);
        });
    });

    describe('$ phonegap analytics --help', function() {
        it('should output usage info', function() {
            cli.argv(argv.concat(['analytics', '--help']));
            expect(stdout.calls.mostRecent().args[0]).toMatch(/usage: [\S]+ analytics/i);
        });
    });

    describe('$ phonegap analytics -h', function() {
        it('should output usage info', function() {
            cli.argv(argv.concat(['analytics', '-h']));
            expect(stdout.calls.mostRecent().args[0]).toMatch(/usage: [\S]+ analytics/i);
        });
    });
});

/*
 * Specification: $ phonegap analytics
 */

describe('phonegap analytics', function() {
    beforeEach(function() {
        cli = new CLI();
        argv = ['node', '/usr/local/bin/phonegap'];
        spyOn(process.stdout, 'write');
        spyOn(cli, 'analytics').and.returnValue({
            on: function() {}
        });
    });

    describe('$ phonegap analytics', function() {
        it('should connect to phonegap analytics', function() {
            cli.argv(argv.concat(['analytics']));
            expect(cli.analytics).toHaveBeenCalled();
        });
    });

    describe('$ phonegap analytics on', function() {
        it('should connect to phonegap analytics', function() {
            cli.argv(argv.concat(['analytics', 'on']));
            expect(cli.analytics).toHaveBeenCalled();
            var analytics_params = cli.analytics.calls.mostRecent().args[0]['_'];
            expect(analytics_params).toContain("analytics");
            expect(analytics_params).toContain("on");
        });
    });

    describe('$ phonegap analytics off', function() {
        it('should connect to phonegap analytics', function() {
            cli.argv(argv.concat(['analytics', 'off']));
            expect(cli.analytics).toHaveBeenCalled();
            var analytics_params = cli.analytics.calls.mostRecent().args[0]['_'];
            expect(analytics_params).toContain("analytics");
            expect(analytics_params).toContain("off");
        });
    });

    describe('prompt', function() {
        var permission_spy, track_spy, revert;
        beforeEach(function() {
            permission_spy = jasmine.createSpy();
            track_spy = jasmine.createSpy();
            revert = analytics.__set__('insight', {
                'askPermission': permission_spy,
                'trackEvent': track_spy
            });
            spyOn(request, 'post');
        });
        afterEach(function() {
            revert(); // restore rewire clobbered globals
        });
        it('should ask permission to track analytics', function(done) {
            permission_spy.and.callFake(function(msg, cb) {
                cb(null, true);
            });
            analytics.prompt(function() {
                expect(permission_spy).toHaveBeenCalled();
                done();
            });
        });
        it('should track opt in', function(done) {
            permission_spy.and.callFake(function(msg, cb) {
                cb(null, true);
            });
            analytics.prompt(function() {
                var event = track_spy.calls.mostRecent().args[0];
                expect(event.category).toEqual('analytics-prompt');
                expect(event.action).toEqual('accepted');
                expect(request.post).toHaveBeenCalled();
                done();
            });
        });
        it('should track opt out', function(done) {
            permission_spy.and.callFake(function(msg, cb) {
                cb(null, false);
            });
            analytics.prompt(function() {
                var event = track_spy.calls.mostRecent().args[0];
                expect(event.category).toEqual('analytics-prompt');
                expect(event.action).toEqual('declined');
                expect(request.post).toHaveBeenCalled();
                done();
            });
        });
    });
});
