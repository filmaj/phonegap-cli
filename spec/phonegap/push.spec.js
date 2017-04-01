/*
 * Module dependencies.
 */

var PhoneGap = require('../../lib/phonegap'),
    fs = require('fs'),
    phonegap;

/*
 * Specification: phonegap.push()
 */

describe('phonegap.push()', function() {
    beforeEach(function() {
        phonegap = new PhoneGap();
    });
    it('should throw if no options are provided');
    it('should throw if no payload is provided');
    it('should use default phonegap push server endpoint if none provided');
    it('should read from a payload file if provided in options');
    it('should fire off a POST to the specified host on a successful call');
});
