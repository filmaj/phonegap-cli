var cli = require('../lib/cli');
var analytics = require('../lib/cli/analytics');

function trigger_phonegap_cli() {
    require('../bin/phonegap');
}

describe('$ phonegap [options] commands', function() {
    var orig_args;
    beforeEach(function() {
        // delete the phonegap cli entry module from require cache
        // so we can exercise its logic in each test case
        delete require.cache[require.resolve('../bin/phonegap')];
        // ensure we dont prompt for turning analytics on
        spyOn(cli.prototype.analytics, 'statusUnknown').and.returnValue(false);
        // dont log analytics during tests - fake the cli out into thinking we opted out
        spyOn(cli.prototype.analytics, 'hasOptedOut').and.returnValue(true);
        orig_args = process.argv;
    });
    afterEach(function() {
        process.argv = orig_args;
    });

    it('should support no arguments and post help', function() {
        spyOn(console, 'log');
        trigger_phonegap_cli();
        expect(console.log.calls.mostRecent().args[0]).toMatch('Usage:');
    });

    it('should support commands', function() {
        process.argv = ['node', 'phonegap.js', 'version'];
        spyOn(console, 'log');
        trigger_phonegap_cli();
        expect(console.log.calls.mostRecent().args[0]).toMatch(/^\w+\.\w+\.\w+/);
    });

    it('should support options', function() {
        process.argv = ['node', 'phonegap.js', '--version'];
        spyOn(console, 'log');
        trigger_phonegap_cli();
        expect(console.log.calls.mostRecent().args[0]).toMatch(/^\w+\.\w+\.\w+/);
    });

    it('should have exit code 0 on successful commands', function() {
        process.argv = ['node', 'phonegap.js', '--version'];
        spyOn(console, 'log');
        trigger_phonegap_cli();
        expect(process.exitCode).toEqual(0);
    });

    describe('on an error', function() {
        it('should have non-zero exit code', function() {
            process.argv = ['node', 'phonegap.js', 'cordova', 'noop'];
            spyOn(cli.prototype, 'argv').and.callFake(function(args, cb) {
                // have argv just blast back an error object to the callback to trigger error flow
                cb({exitCode:1337});
            });
            trigger_phonegap_cli();
            expect(process.exitCode).toEqual(1337);
        });
    });
});
