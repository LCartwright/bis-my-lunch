var jsdom = require("jsdom");
var fs = require("fs");
var http = require('http');
var url = require("url");
var path = require("path");
var jquery = fs.readFileSync("./node_modules/jquery/dist/jquery.slim.js", "utf-8");
 
jsdom.env({
  url: "http://bis.baxterstorey.com/extranet/restaurant_and_cafe.vc",
  src: [jquery],
  done: function (err, window) {
    var $ = window.$;
    console.log("Finding menu...");
    var menu = $("#menudownloads li a")
    .filter(function(){
      return $(this).text().toLowerCase() == "weekly menu";
    })
    .first();
  
    if (typeof menu != 'undefined' && menu != null && menu.length > 0) {
      console.log("Menu found!");
      var menuHref = menu.attr("href");
      var menuUrl = window.location.protocol + "//" + window.location.host + "/" + menuHref;
      var parsed = url.parse(menuUrl);
      var filename = path.basename(parsed.pathname)
      console.log(menuUrl);
      console.log(filename);
      download(menuUrl, filename, function(success, message){
        if (success == true) {
          console.log("Downloaded file " + filename);
        }
        else {
          console.log("Error downloading file " + filename);
          console.log(message);
        }
      });
    } 
    else {
      console.log("Could not locate menu");
    }

  }
});

/** https://stackoverflow.com/questions/11944932/how-to-download-a-file-with-node-js-without-using-third-party-libraries */
var download = function(url, dest, cb) {
  var file = fs.createWriteStream(dest);
  var request = http.get(url, function(response) {
    response.pipe(file);
    file.on('finish', function() {
      file.close(cb(true));  // close() is async, call cb after close completes.
    });
  }).on('error', function(err) { // Handle errors
    fs.unlink(dest); // Delete the file async. (But we don't check the result)
    if (cb) cb(false, err.message);
  });
};

