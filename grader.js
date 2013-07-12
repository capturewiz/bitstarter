#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var rest = require('restler');
var util = require('util');

var CHECKSFILE_DEFAULT = "checks.json";

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

var assertValidUrl = function(aInUrl) {
    return aInUrl.toString();
};

var cheerioHtmlFile = function(aHtmlstring) {
    return cheerio.load(aHtmlstring);
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function(aHtmlfile, aChecksfile, aHtmlurl) {
    console.error('aHtmlfile=' + aHtmlfile + ', aChecksfile=' + aChecksfile + ', aHtmlurl=' + aHtmlurl);
    if (aHtmlfile === '') {
	rest.get(aHtmlurl).on(
	    'complete', 
	    handleRestResponse(aChecksfile)
        );

    } else {
	console.error("Read from local file");
	handleHtmlString(fs.readFileSync(aHtmlfile), aChecksfile);
    };
};

var handleRestResponse = function(aChecksfile) {
    return function(aResult) {
	if (aResult instanceof Error) {
	    console.error('Error: ' + util.format(aResponse.message));
	    
	} else {
	    console.error("Successful download");
	    handleHtmlString(aResult, aChecksfile);
	}
    };
};

var handleHtmlString = function(aHtmlstring, aChecksfile) {
//    console.error("aHtmlstring=" + aHtmlstring + ", aChecksfile=" + aChecksfile);
    $ = cheerioHtmlFile(aHtmlstring);

    var checks = loadChecks(aChecksfile).sort();

    var out = {};
    for(var ii in checks) {
        var present = $(checks[ii]).length > 0;
        out[checks[ii]] = present;
    };

    var outJson = JSON.stringify(out, null, 4);
    console.log(outJson);
};

var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

if(require.main == module) {
    program
        .option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), '')
        .option('-u, --url <html_url>', 'Url to index.html', clone(assertValidUrl), '')
        .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
        .parse(process.argv);
    checkHtmlFile(program.file, program.checks, program.url);
} else {
    exports.checkHtmlFile = checkHtmlFile;
}
