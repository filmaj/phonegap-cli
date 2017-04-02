var phonegap = require('../../lib/main');
var share = require('../../lib/cli/share');

/*
 * Specification: $ phonegap share
 */

describe('phonegap share', function() {
    beforeEach(function() {
        spyOn(phonegap, 'share');
    });
    it('should delegate to the phonegap/share module', function() {
        share({});
        expect(phonegap.share).toHaveBeenCalled();
    });
    it('should pass errors from the phonegap/share module to the provided callback', function() {
        phonegap.share.and.callFake(function(data, cb) {
            // call back with an error object to fake an error
            cb({explosions:true});
        });
        var cb = jasmine.createSpy();
        share({}, cb);
        expect(cb).toHaveBeenCalledWith({explosions:true});
    });
});
