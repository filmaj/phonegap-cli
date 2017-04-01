/*
 * Module dependencies.
 */

var phonegap = require('../../lib/main'),
    CLI = require('../../lib/cli'),
    argv,
    cli;

/*
 * Specification: $ phonegap share
 */

describe('phonegap share', function() {
    beforeEach(function() {
        cli = new CLI();
        argv = ['node', '/usr/local/bin/phonegap'];
    });
    it('should delegate to the phonegap/share module');
    it('should pass errors from the phonegap/share module to the provided callback');

});
