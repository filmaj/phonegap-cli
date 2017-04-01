/*
 * Module dependencies.
 */

var PhoneGap = require('../../lib/phonegap'),
    fs = require('fs'),
    phonegap;

/*
 * Specification: phonegap.share()
 */

describe('phonegap.share()', function() {
    beforeEach(function() {
        phonegap = new PhoneGap();
    });
    it('should trigger dropbox upload if provided in options');
    it('should go through the "serve" flow if the connect option is specified');
    describe('without dropbox or connect options specified', function() {
        it('should invoke cordova prepare');
        it('should create a dropbox zip archive after cordova prepare');
        it('should upload the archive via the proxy module if successful');
        it('should log out an error if zip archive creation was not successful');
    });
});
