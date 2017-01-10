var jsdom = require("jsdom");
var fs = require("fs");
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
      var menuText = menu.text();
      var menuUrl = window.location.protocol + "//" + window.location.host + "/" + menuHref;
      console.log(menuUrl);
    } 
    else {
      console.log("Could not locate menu");
    }

  }
});